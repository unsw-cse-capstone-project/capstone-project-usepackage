import Stretch from './Stretch.js'
import RateTransposer from './RateTransposer.js';
import FifoSampleBuffer from './FifoSampleBuffer.js'
import CutManager from './Cut.js'

const FRAMESIZE = 128;

class CustomProcessor extends AudioWorkletProcessor {

    constructor() {
        super();
        this._bufferInfo = {
            sampleRate: 0,
            duration: 0,
            numberOfChannels: 0,
            length: 0,
            channelOne: [],
            channelTwo: []
        };
        this._sourceData = {
            cut: null,
            index: -1,
            remain: 0,
            frame: 0,
            chunk: 0,
            liveChunk: FRAMESIZE
        }
        this._cuts = null;
        this._interleave = null;
        this._initialized = false;
        this._frame = 0;
        this._playing = false;
        this._stretch = new Stretch(false);
        this._transposer = new RateTransposer(false);
        this._buffers = [
            new FifoSampleBuffer(),
            new FifoSampleBuffer(),
            new FifoSampleBuffer()
        ];
        this.calculateEffectiveValues(1, 1);
        this.port.onmessage = (e) => {
            const msg = e.data;
            let title = msg.title;
            let data = msg.data;
            if ("Begin" === title) {
                this._bufferInfo = data;
                this._interleave = new Float32Array(data.channelOne.length * 2);
                for (let i = 0; i < data.channelOne.length; i++) {
                    this._interleave[2 * i] = data.channelOne[i];
                    this._interleave[2 * i + 1] = data.channelTwo[i];
                }
                this._cuts = new CutManager(data.channelOne.length);
                // this._cuts.addCut(data.sampleRate * 2);
                // this._cuts.cuts[1].tempo = 2;
                console.log(this._interleave);
                this._initialized = true;
                this.port.postMessage({
                    title: "Ready",
                    data: "Processor is ready"
                })
                return;
            }

            if (!(title === "Lengths" || title === "Update" || title === "Undo" || title === "Redo")) {
                this._cuts.dumpRedo();
            }

            if ("Update" === title) {
                this._playing = !data.paused;
            }

            if ("Cut" === title) {
                this._cuts.addCut(data);
            }

            if ("Tempo" === title) {
                console.log("Slice: ", data.index);
                console.log("Tempo:", data.value);
                this._cuts.setTempo(data.index, data.value);
            }

            if ("Gain" === title) {
                console.log("Slice: ", data.index);
                console.log("Gain:", data.value);
                console.log("Channel:", data.channel);
                this._cuts.setGain(data.index, data.channel, data.value);
            }

            if ("Pitch" === title) {
                console.log("Slice: ", data.index);
                console.log("Pitch:", data.value);
                this._cuts.setPitch(data.index, data.value);
            }

            if ("Crop" === title) {
                this._cuts.crop(data);
            }

            if ("Copy" === title) {
                this._cuts.copy(data.from, data.to);
            }

            if ("Move" === title) {
                this._cuts.move(data.from, data.to);
            }

            if ("Undo" === title) {
                this._cuts.undo();
            }

            if ("Redo" === title) {
                this._cuts.redo();
            }

            this.port.postMessage({
                title: "Lengths",
                data: this._cuts.getLengths()
            });
        }
        this.port.postMessage({
            title: "Initialised",
            data: "Ready to take information"
        })
    }

    stop() {
        this._playing = false;
        this._frame = 0;
        this._sourceData.remain = 0;
        this._sourceData.index = -1;
        this._stretch.clear();
        this._transposer.clear();
        this._buffers = [
            new FifoSampleBuffer(),
            new FifoSampleBuffer(),
            new FifoSampleBuffer()
        ];
        this.port.postMessage({
            title: "Stop",
            data: {
                time: 0
            }
        });
        console.log("Stopped");
    }


    update() {
        this._frame += 1;
        this.port.postMessage({
            title: "Position",
            data: {
                time: this._frame,
                cut: this._sourceData.cut
            }
        });
    }

    testFloatEqual(a, b) {
        return (Math.abs(a - b) < 1e-10);
    }

    calculateEffectiveValues(virtualTempo, pitch) {
        const tempo = virtualTempo / pitch;

        this._stretch.tempo = tempo;
        this._transposer.rate = pitch;

        if (this._transposer.rate > 1) {
            this._stretch.inputBuffer = this._buffers[0];
            this._stretch.outputBuffer = this._buffers[1];
            this._transposer.inputBuffer = this._buffers[1];
            this._transposer.outputBuffer = this._buffers[2];
            this._sourceData.chunk = this._stretch.inputChunkSize;
            console.log("CONNECT 1");
        } else {
            this._transposer.inputBuffer = this._buffers[0];
            this._transposer.outputBuffer = this._buffers[1];
            this._stretch.inputBuffer = this._buffers[1];
            this._stretch.outputBuffer = this._buffers[2];
            this._sourceData.chunk = Math.ceil(this._stretch.inputChunkSize * pitch);
            console.log("CONNECT 2");
        }
        this._sourceData.liveChunk = Math.ceil(FRAMESIZE * virtualTempo);
        console.log(this._sourceData.chunk);
        console.log(this._sourceData.liveChunk);
    }

    toClear() {
        if (this._sourceData.cut || this._sourceData.index < 0)
            return true;
        if (this._buffers[2].frameCount > 0)
            return true;
        this.stop();
        return false;
    }

    processIntoBuffer(length) {
        const initLength = this._buffers[2].frameCount;
        this._buffers[0].putSamples(this._interleave, this._sourceData.frame, length);
        this._sourceData.frame += length;
        this.processBuffer();
        if (initLength != this._buffers[2].frameCount) {
            this._sourceData.remain -= (this._buffers[2].frameCount - initLength);
        }
    }

    startCut() {
        if (this._sourceData.remain > 0)
            return;
        if (this._sourceData.remain < 0) {
            this._buffers[2].put(this._sourceData.remain);
            this._sourceData.remain = 0;
        }
        if (!this._sourceData.cut && this._sourceData.index >= 0)
            return;
        do {
            this._sourceData.index++;
            this._sourceData.cut = this._cuts.get(this._sourceData.index);
        } while (this._sourceData.cut && this._sourceData.cut.cropped);
        this.x = true;
        if (!this._sourceData.cut)
            return;
        this.calculateEffectiveValues(this._sourceData.cut.tempo, this._sourceData.cut.pitch);
        this._sourceData.frame = this._sourceData.cut.sourceStart;
        this._sourceData.remain = Math.floor((this._sourceData.cut.sourceEnd - this._sourceData.frame) / this._sourceData.cut.tempo);
        this._buffers[0].clear();
        this._buffers[1].clear();
        this.a = true;
        this.processIntoBuffer(this._sourceData.chunk);
    }

    loadIntoBuffer() {
        if (!this.toClear())
            return false;
        this.startCut();
        this.processIntoBuffer(this._sourceData.liveChunk);
        return true;
    }

    processBuffer() {
        if (this.a) {
            console.log(this._buffers[0].frameCount);
            console.log(this._buffers[1].frameCount);
            console.log(this._buffers[2].frameCount);
        }
        if (this._transposer.rate > 1) {
            this._stretch.process();
            this._transposer.process();
        } else {
            this._transposer.process();
            this._stretch.process();
        }
        if (this.a) {
            this.a = false;
            console.log(this._buffers[0].frameCount);
            console.log(this._buffers[1].frameCount);
            console.log(this._buffers[2].frameCount);
        }
    }

    process(inputs, outputs) {
        if (!this._initialized)
            return true;
        if (!this._playing || !this.loadIntoBuffer()) {
            // Hotfix
            outputs[0].forEach(channel => {
                channel.fill(0);
            });
            return true;
        }

        if (this._buffers[2].frameCount < FRAMESIZE && this._sourceData.cut)
            console.log("BUFFER BEHIND", this._buffers[2].frameCount);
        const output = new Float32Array(2 * FRAMESIZE);
        this._buffers[2].receiveSamples(output, FRAMESIZE);
        let gain;
        if (this._sourceData.cut)
            gain = this._sourceData.cut.gain;
        else
            gain = this._cuts.get(this._sourceData.index - 1).gain;

        outputs[0].forEach((channel, num) => {
            for (let i = 0; i < channel.length; i++) {
                channel[i] = output[2 * i + num] * gain[num];
            }
        });
        this.update();
        return true;
    }
}

registerProcessor('CustomProcessor', CustomProcessor);