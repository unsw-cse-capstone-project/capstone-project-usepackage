import ActionStack from "./ActionStack.js";

export default class CutManager {
    // Constructor takes in the length of the buffer
    constructor(length) {
        this.cuts = [{
            sourceStart: 0,
            sourceEnd: length,
            tempo: 1,
            pitch: 1,
            gain: [1, 1],
            cropped: false
        }];
        this.stack = new ActionStack();
        this.redoStack = new ActionStack();
    }

    getStack() {
        return this.stack.stack()
    }

    getLengths() {
        return this.cuts.map(cut => ({
            length: Math.floor((cut.sourceEnd - cut.sourceStart) / cut.tempo),
            cropped: cut.cropped
        }));
    }

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

    get(index) {
        return this.cuts[index];
    }

    addCutIndex(index, time) {
        let sum = 0;
        for (let i = 0; i < index; i++)
            sum += this.cuts[i].length;
        this.addCut(sum + time);
    }

    addCut(time, push = true) {
        for (let i = 0; i < this.cuts.length; i++) {
            if (this.cuts[i].sourceEnd >= time) {
                if (push)
                    this.stack.push({
                        type: "cut",
                        time: time,
                        at: i + 1
                    });
                const firstCut = {
                    sourceStart: this.cuts[i].sourceStart,
                    sourceEnd: time,
                    tempo: this.cuts[i].tempo,
                    pitch: this.cuts[i].pitch,
                    gain: this.cuts[i].gain.slice(),
                    cropped: this.cuts[i].cropped
                }
                const secondCut = {
                    sourceStart: time,
                    sourceEnd: this.cuts[i].sourceEnd,
                    tempo: this.cuts[i].tempo,
                    pitch: this.cuts[i].pitch,
                    gain: this.cuts[i].gain,
                    cropped: this.cuts[i].cropped
                }
                this.cuts.splice(i, 1, firstCut, secondCut);
                console.log("Cut added:");
                this.cuts.forEach(cut => { return console.log(cut.sourceStart); });
                break;
            }
        }
    }

    // Requires index > 0
    removeCut(index, push = true) {
        if (index <= 0)
            return false;
        this.cuts[index - 1].sourceEnd = this.cuts[index].sourceEnd;
        if (push)
            this.stack.push({
                type: "unCut",
                time: this.cuts[index].sourceStart,
                tempo: this.cuts[index].tempo,
                pitch: this.cuts[index].pitch,
                gain: this.cuts[index].gain,
                cropped: this.cuts[index].cropped
            });
        console.log("Removing cut!");
        this.cuts.forEach(cut => { return console.log(cut.sourceStart); });
        this.cuts.splice(index, 1);
        console.log("Cut removed:");
        this.cuts.forEach(cut => { return console.log(cut.sourceStart); });
    }

    crop(i) {
        this.cuts[i].cropped = !this.cuts[i].cropped;
        this.stack.push({
            type: 'crop',
            index: i
        })
    }

    copy(from, to) {
        const traveller = {
            ...this.cuts[from],
            gain: this.cuts[from].gain.slice(0)
        };
        this.cuts.splice(to, 0, traveller);
        this.stack.push({
            type: 'copy',
            from: from,
            to: to
        })
    }

    move(from, to) {
        let traveller = this.cuts.splice(from, 1);
        this.cuts.splice(to, 0, traveller[0]);
        this.stack.push({
            type: 'move',
            from: from,
            to: to
        })
    }

    undo() {
        let action = this.stack.applyPop();
        if (action === undefined) return false;
        if (action.type === 'cut') {
            const i = action.at;
            this.removeCut(i, false);
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
            const to = action.to;
            const from = action.from;
            let traveller = this.cuts.splice(to, 1);
            this.cuts.splice(from, 0, traveller[0]);
        }

        this.stack._stack.forEach(act => { return console.log(act.type); });
        this.redoStack.push(action);
    }

    redo() {
        let action = this.redoStack.applyPop();
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

    }

    dumpRedo() {
        this.redoStack.dump();
    }
}