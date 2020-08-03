import ActionStack from "./ActionStack.js";

export default class CutManager {
    // Constructor takes in the length of the buffer, and optional initial cuts and stack
    constructor(length, cuts = null, stack = []) {
        if (!cuts)
            this.cuts = [{
                sourceStart: 0,
                sourceEnd: length,
                tempo: 1,
                pitch: 1,
                gain: [1, 1],
                cropped: false
            }];
        else
            this.cuts = cuts;
        this.stack = new ActionStack();
        // If stack isn't empty, set it to the redo stack and reapply all changes
        this.redoStack = new ActionStack(stack.reverse());
        while (this.redo());
    }

    // Convert a time to a cut index
    timeToCut(time) {
        for (let i = 0, cumtime = 0; i < this.cuts.length; i++) {
            cumtime += (this.cuts[i].sourceEnd - this.cuts[i].sourceStart) / this.cuts[i].tempo;
            if (cumtime >= time) {
                return {
                    cut: this.cuts[i],
                    index: i,
                    cumtime: cumtime
                };
            }
        }
        return null;
    }

    // Get the stack
    getStack() {
        return this.stack.stack()
    }

    // Get the lengths of the cuts, after tempo
    getLengths() {
        return this.cuts.map(cut => ({
            length: Math.floor((cut.sourceEnd - cut.sourceStart) / cut.tempo),
            cropped: cut.cropped
        }));
    }

    // Set the tempo of a cut
    setTempo(index, value, push = true) {
        const oldVal = this.cuts[index].tempo;
        this.cuts[index].tempo = value;
        if (push)
            this.stack.push({
                type: "tempo",
                index: index,
                from: oldVal,
                to: value
            });
    }

    // Set the pitch of a cut
    setPitch(index, value, push = true) {
        const oldVal = this.cuts[index].pitch;
        this.cuts[index].pitch = value;
        if (push)
            this.stack.push({
                type: "pitch",
                index: index,
                from: oldVal,
                to: value
            });
    }

    // Set the gain of a given channel in a cut
    setGain(index, channel, value, push = true) {
        const oldVal = this.cuts[index].gain[channel];
        this.cuts[index].gain[channel] = value;
        if (push)
            this.stack.push({
                type: "gain",
                index: index,
                channel: channel,
                from: oldVal,
                to: value
            });
    }

    // Get the corresponding cut
    get(index) {
        return this.cuts[index];
    }

    // Move a cut, truncating
    moveCut(index, offsetOrig, push = true) {
        if (offsetOrig == 0)
            return;
        if (offsetOrig < 0) {
            const offset = Math.ceil(offsetOrig * this.cuts[index].tempo);
            const newEnd = this.cuts[index].sourceEnd + offset;
            if (newEnd <= this.cuts[index].sourceStart) {
                // Off the start, so delete
                this.removeCut(index);
            } else {
                // Adjust the end
                if (push)
                    this.stack.push({
                        type: "adjustend",
                        at: index,
                        offset: offset,
                        original: offsetOrig
                    });
                this.cuts[index].sourceEnd = newEnd;
            }
        } else {
            index++;
            const offset = Math.floor(offsetOrig * this.cuts[index].tempo);
            const newStart = this.cuts[index].sourceStart + offset;
            if (newStart >= this.cuts[index].sourceEnd) {
                // Off the end, so delete
                this.removeCut(index);
            } else {
                // Adjust the start
                if (push)
                    this.stack.push({
                        type: "adjuststart",
                        at: index,
                        offset: offset,
                        original: offsetOrig
                    });
                this.cuts[index].sourceStart = newStart;
            }
        }
    }

    // Add a cut at a given time
    addCut(time, push = true) {
        // We need the cut
        const cutval = this.timeToCut(time);
        if (cutval) {
            const cut = cutval.cut;
            const index = cutval.index;
            if (push)
                this.stack.push({
                    type: "cut",
                    time: time,
                    at: index + 1
                });
            const cutTime = Math.floor(cut.sourceEnd - (cutval.cumtime - time) * cut.tempo);
            // Two cuts, each with the same details, excluding the sourceStart/End
            const firstCut = {
                sourceStart: cut.sourceStart,
                sourceEnd: cutTime,
                tempo: cut.tempo,
                pitch: cut.pitch,
                gain: cut.gain.slice(),
                cropped: cut.cropped
            }
            const secondCut = {
                sourceStart: cutTime,
                sourceEnd: cut.sourceEnd,
                tempo: cut.tempo,
                pitch: cut.pitch,
                gain: cut.gain,
                cropped: cut.cropped
            }
            this.cuts.splice(index, 1, firstCut, secondCut);
        }
    }

    // Remove a cut
    removeCut(index, push = true) {
        if (push)
            this.stack.push({
                type: "delete",
                from: index,
                data: this.cuts[index]
            });
        this.cuts.splice(index, 1);
    }

    // Mark a cut as cropped
    crop(i) {
        this.cuts[i].cropped = !this.cuts[i].cropped;
        this.stack.push({
            type: 'crop',
            index: i
        })
    }

    // Copy a cut from one index to another
    copy(from, to) {
        const traveller = {
            ...this.cuts[from],
            gain: this.cuts[from].gain.slice(0),
        };
        this.cuts.splice(to, 0, traveller);
        this.stack.push({
            type: 'copy',
            from: from,
            to: to
        })
    }

    // Move a cut from one index to another
    move(from, to) {
        let index = to;
        if (from < to)
            index = to - 1;
        if (from == to)
            return;
        const temp = this.cuts.splice(from, 1);
        this.cuts.splice(index, 0, ...temp);
        this.stack.push({
            type: 'move',
            from: from,
            to: to,
            index: index
        });
    }

    // Undo an action
    undo() {
        let action = this.stack.pop();
        if (action === undefined) return false;
        if (action.type === 'cut') {
            const i = action.at;
            this.cuts[i - 1].sourceEnd = this.cuts[i].sourceEnd;
            this.cuts.splice(i, 1);
        }

        if (action.type === 'tempo') {
            const i = action.index;
            const old = action.from;
            this.setTempo(i, old, false);
        }

        if (action.type === 'pitch') {
            const i = action.index;
            const old = action.from;
            this.setPitch(i, old, false);
        }

        if (action.type === 'gain') {
            const i = action.index;
            const channel = action.channel;
            const old = action.from;
            this.setGain(i, channel, old, false);
        }

        if (action.type === 'crop') {
            const i = action.index;
            this.cuts[i].cropped = !this.cuts[i].cropped;
        }

        if (action.type === 'copy') {
            const to = action.to;
            this.cuts.splice(to, 1);
        }

        if (action.type === 'move') {
            const temp = this.cuts.splice(action.index, 1);
            this.cuts.splice(action.from, 0, ...temp);
        }

        if (action.type === 'adjuststart') {
            this.cuts[action.index].sourceStart -= action.offset;
        }

        if (action.type === 'adjustend') {
            this.cuts[action.index].sourceEnd -= action.offset;
        }

        if (action.type === 'remove') {
            this.cuts.splice(action.from, 0, action.data);
        }

        this.stack._stack.forEach(act => { return console.log(act.type); });
        this.redoStack.push(action);

        return true;
    }

    // Redo an action
    redo() {
        let action = this.redoStack.pop();
        if (action === undefined) return false;

        if (action.type === 'cut') {
            const time = action.time;
            this.addCut(time);
        }

        if (action.type === 'tempo') {
            const i = action.index;
            const newVal = action.to;
            this.setTempo(i, newVal);
        }

        if (action.type === 'pitch') {
            const i = action.index;
            const newVal = action.to;
            this.setPitch(i, newVal);
        }

        if (action.type === 'gain') {
            const i = action.index;
            const channel = action.channel;
            const newVal = action.to;
            this.setGain(i, channel, newVal);
        }

        if (action.type === 'crop') {
            const i = action.index;
            this.crop(i);
        }

        if (action.type === 'copy') {
            const from = action.from;
            const to = action.to;
            this.copy(from, to);
        }

        if (action.type === 'move') {
            const to = action.to;
            const from = action.from;
            this.move(from, to);
        }

        if (action.type === 'adjuststart') {
            this.moveCut(action.index, action.offsetOrig);
        }

        if (action.type === 'adjustend') {
            this.moveCut(action.index, action.offsetOrig);
        }

        if (action.type === 'remove') {
            this.removeCut(action.from);
        }

        return true;
    }

    // Empty the redo stack; for when an action is made
    dumpRedo() {
        this.redoStack.dump();
    }
}