import Stretch from './Stretch.js'
import RateTransposer from './RateTransposer.js';
import FifoSampleBuffer from './FifoSampleBuffer.js'
import CutManager from './Cut.js'
import MsgType from './messageTypes.js';

const FRAMESIZE = 128;

class CustomProcessor extends AudioWorkletProcessor {

    constructor() {
        super();
        this._bufferInfo = {
            sampleRate: 0,
            duration: 0,
            length: 0,
            buffer: []
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
        this.port.onmessage = (e) => this._handleMessage(e.data);
        this.port.postMessage({
            type: MsgType.INIT
        });
    }

    _handleMessage(msg) {
        const data = msg.data;

        switch (msg.type) {
            case MsgType.START:
                this._bufferInfo = data;
                this._interleave = data.buffer;
                this._cuts = new CutManager(data.length, data.cuts, data.stack);
                this._initialized = true;
                this.port.postMessage({
                    type: MsgType.READY
                });
                return;

            case MsgType.SEEK:
                this.seek(data.slice, data.time);
                return;

            case MsgType.PLAY:
                this._playing = data;
                return;

            case MsgType.CUT:
                this._cuts.dumpRedo();
                this._cuts.addCut(data);
                break;

            case MsgType.TEMPO:
                console.log("Slice: ", data.index); // DEBUG
                console.log("Tempo:", data.value); // DEBUG
                this._cuts.dumpRedo();
                this._cuts.setTempo(data.index, data.value);
                break;

            case MsgType.GAIN:
                console.log("Slice: ", data.index); // DEBUG
                console.log("Gain:", data.value); // DEBUG
                console.log("Channel:", data.channel); // DEBUG
                this._cuts.dumpRedo();
                this._cuts.setGain(data.index, data.channel, data.value);
                break;

            case MsgType.PITCH:
                console.log("Slice: ", data.index); // DEBUG
                console.log("Pitch:", data.value); // DEBUG
                this._cuts.dumpRedo();
                this._cuts.setPitch(data.index, data.value);
                break;

            case MsgType.CROP:
                this._cuts.dumpRedo();
                this._cuts.crop(data);
                break;

            case MsgType.COPY:
                this._cuts.dumpRedo();
                this._cuts.copy(data.from, data.to);
                break;

            case MsgType.MOVE:
                this._cuts.dumpRedo();
                this._cuts.move(data.from, data.to);
                break;

            case MsgType.MOVECUT:
                this._cuts.dumpRedo();
                this._cuts.moveCut(data.index, data.offset);
                break;

            case MsgType.UNDO:
                this._cuts.undo();
                break;

            case MsgType.REDO:
                this._cuts.redo();
                break;

            case MsgType.STACK:
                this.port.postMessage({
                    type: MsgType.STACK,
                    data: this._cuts.getStack()
                });
                return;

            case MsgType.UPDATE:
                this.port.postMessage({
                    type: MsgType.UPDATE,
                    data: {
                        gain: this._cuts.get(data).gain,
                        tempo: this._cuts.get(data).tempo,
                        pitch: this._cuts.get(data).pitch
                    }
                });
                return;

            case MsgType.LENGTH:
                break;

            default:
                console.error("Unknown message type in node", msg.type);
                return;
        }

        this.port.postMessage({
            type: MsgType.LENGTH,
            data: {
                lengths: this._cuts.getLengths(),
                cuts: this._cuts.cuts
            }
        });
    }

    seek(slice, time) {
        console.log("SEEK TO", { slice: slice, time: time }); // DEBUG
        let cut = this._cuts.get(slice);
        while (cut && cut.cropped) {
            cut = this._cuts.get(++slice);
            time = 0;
        }
        if (!cut)
            return;
        const lengths = this._cuts.getLengths();
        let sum = 0;
        for (let i = 0; i < slice; i++)
            sum += lengths[i].cropped ? 0 : lengths[i].length;
        sum += time;
        sum /= FRAMESIZE;
        sum = Math.floor(sum);

        this._frame = sum;
        this._stretch.clear();
        this._transposer.clear();
        this._buffers = [
            new FifoSampleBuffer(),
            new FifoSampleBuffer(),
            new FifoSampleBuffer()
        ];
        this._sourceData.index = slice;
        this._sourceData.cut = cut;
        this.calculateEffectiveValues(this._sourceData.cut.tempo, this._sourceData.cut.pitch);
        this._sourceData.frame = this._sourceData.cut.sourceStart + time;
        this._sourceData.remain = Math.floor((this._sourceData.cut.sourceEnd - this._sourceData.frame) / this._sourceData.cut.tempo);
        this._buffers[0].clear();
        this._buffers[1].clear();
        this.processIntoBuffer(this._sourceData.chunk);
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
            type: MsgType.STOP,
            data: 0
        });
        console.log("Stopped"); // DEBUG
    }


    update() {
        this._frame += 1;
        this.port.postMessage({
            type: MsgType.POS,
            data: {
                time: this._frame,
                cut: this._sourceData.cut,
                index: (this._sourceData.index > this._cuts.cuts.length ?
                    this._cuts.cuts.length - 1 :
                    this._sourceData.index)
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
        } else {
            this._transposer.inputBuffer = this._buffers[0];
            this._transposer.outputBuffer = this._buffers[1];
            this._stretch.inputBuffer = this._buffers[1];
            this._stretch.outputBuffer = this._buffers[2];
            this._sourceData.chunk = Math.ceil(this._stretch.inputChunkSize * pitch);
        }
        this._sourceData.liveChunk = Math.ceil(FRAMESIZE * virtualTempo);
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
        if (!this._sourceData.cut)
            return;
        this.calculateEffectiveValues(this._sourceData.cut.tempo, this._sourceData.cut.pitch);
        this._sourceData.frame = this._sourceData.cut.sourceStart;
        this._sourceData.remain = Math.floor((this._sourceData.cut.sourceEnd - this._sourceData.frame) / this._sourceData.cut.tempo);
        this._buffers[0].clear();
        this._buffers[1].clear();
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
        if (this._transposer.rate > 1) {
            this._stretch.process();
            this._transposer.process();
        } else {
            this._transposer.process();
            this._stretch.process();
        }
    }

    process(_, outputs) {
        if (!this._initialized)
            return true;
        if (!this._playing || !this.loadIntoBuffer()) {
            outputs[0].forEach(channel => {
                channel.fill(0);
            });
            return true;
        }

        if (this._buffers[2].frameCount < FRAMESIZE && this._sourceData.cut)
            console.error("The output buffer hasn't been completely filled", this._buffers[2].frameCount);
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