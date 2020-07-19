import ActionStack from "/ActionStack.js";

export default class CutManager {
    // Constructor takes in the length of the buffer
    constructor(length) {
        this.cuts = [{
            sourceStart: 0,
            sourceEnd: length,
            tempo: 1,
            pitch: 1,
            gain: [1, 1]
        }];
        this.stack = new ActionStack();
    }

    get(index) {
        return this.cuts[index];
    }

    addCut(time) {
        for (let i = 0; i < this.cuts.length; i++) {
            if (this.cuts[i].sourceEnd >= time) {
                this.stack.push({
                    type: "cut",
                    time: time,
                    at: i
                });
                const firstCut = {
                    sourceStart: this.cuts[i].sourceStart,
                    sourceEnd: time,
                    tempo: this.cuts[i].tempo,
                    pitch: this.cuts[i].pitch,
                    gain: this.cuts[i].gain.slice()
                }
                const secondCut = {
                    sourceStart: time,
                    sourceEnd: this.cuts[i].sourceEnd,
                    tempo: this.cuts[i].tempo,
                    pitch: this.cuts[i].pitch,
                    gain: this.cuts[i].gain
                }
                this.cuts.splice(i, 1, firstCut, secondCut);
                break;
            }
        }
    }

    // Requires index > 0
    removeCutIndex(index) {
        this.cuts[i - 1].sourceEnd = this.cuts[i].sourceEnd;
        this.cuts.splice(i, 1);
        // TODO: Push to action stack, + take note of gain, pitch and tempo
    }

    // Time must not be zero
    removeCutTime(time) {
        for (i = 0;; i++) {
            if (this.cuts[i].sourceStart === time) {
                this.cuts[i - 1].sourceEnd = this.cuts[i].sourceEnd;
                this.cuts.splice(i, 1);
                // TODO: Push to action stack, + take note of gain, pitch and tempo
                break;
            }
        }
    }
}