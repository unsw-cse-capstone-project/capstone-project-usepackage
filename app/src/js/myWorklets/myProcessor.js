import Stretch from '/Stretch.js'
import RateTransposer from '/RateTransposer.js';
import FifoSampleBuffer from '/FifoSampleBuffer.js'
import CutManager from '/Cut.js'

// myProcessor.js
class TestProcessor extends AudioWorkletProcessor {

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
        this._cuts = null;
        this._cut = null;
        this._cutIndex = -1;
        this._interleave = null;
        this._initialized = false;
        this._frame = 0;
        this._sourceFrame = 0;
        this._chunkSize = 0;
        this._playing = false;
        this._stretch = new Stretch(false);
        this._transposer = new RateTransposer(false);
        this._buffers = [
            new FifoSampleBuffer(),
            new FifoSampleBuffer(),
            new FifoSampleBuffer()
        ]
        this.calculateEffectiveValues(1, 1);
        // The buffer parsed to the output after undergoing some processing
        this._samples = new Float32Array(2 * 128)
        this.port.onmessage = (e) => {
            const msg = e.data;
            let title = msg.title;
            let data = msg.data;
            if ("Begin" === title) {
                this._bufferInfo = data;
                this.port.postMessage({
                    title: "Ready",
                    data: "Processor is ready"
                })
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
            }

            if ("Update" === title) {
                this._playing = !data.paused;
            }
            
            if("Cut" === title) {
                this._cuts.addCut(data);
            }
            
            if("Tempo" === title) {
                console.log("Slice: ", data[1]);
                console.log("Tempo:", data[0]);
                this._cuts.cuts[data[1]].tempo = data[0];
            }
            
            if("Pitch" === title) {
                console.log("Slice: ", data[1]);
                console.log("Pitch:", data[0]);
                this._cuts.cuts[data[1]].pitch = data[0];
            }
        }
        this.port.postMessage({
            title: "Initialised",
            data: "Ready to take information"
        })
    }

    stop() {
        this._playing = false;
        this._frame = 0;
        this._sourceFrame = 0;
        this._cutIndex = -1;
        this.port.postMessage({
            title: "Stop",
            data: {
                time: 0
            }
        });
    }


    update() {
        this._frame += 1;
        this.port.postMessage({
            title: "Position",
            data: {
                time: this._frame
            }
        });
    }

    testFloatEqual(a, b) {
        return (Math.abs(a - b) < 1e-10);
    }

    calculateEffectiveValues(tempo, pitch) {
        tempo /= pitch;

        if (!this.testFloatEqual(tempo, this._stretch.tempo)) {
            this._stretch.tempo = tempo;
        }
        if (!this.testFloatEqual(pitch, this._transposer.rate)) {
            this._transposer.rate = pitch;
        }

        if (this._transposer.rate > 1) {
            if (this._buffers[2] != this._transposer.outputBuffer) {
                this._stretch.inputBuffer = this._buffers[0];
                this._stretch.outputBuffer = this._buffers[1];
                this._transposer.inputBuffer = this._buffers[1];
                this._transposer.outputBuffer = this._buffers[2];
            }
        } else {
            if (this._buffers[2] != this._stretch.outputBuffer) {
                this._transposer.inputBuffer = this._buffers[0];
                this._transposer.outputBuffer = this._buffers[1];
                this._stretch.inputBuffer = this._buffers[1];
                this._stretch.outputBuffer = this._buffers[2];
            }
        }
    }

    process(inputs, outputs, params) {
        if (!this._initialized) return true;
        let input = [this._bufferInfo.channelOne, this._bufferInfo.channelTwo];
        let output = new Float32Array(256);
        if (this._playing) {
            if (this._cutIndex < 0 || (this._sourceFrame >= this._cut.sourceEnd && (this._cutIndex < this._cuts.cuts.length - 1 || this._buffers[2].frameCount == 0))) {
                this._cutIndex++;
                this._cut = this._cuts.get(this._cutIndex);
                console.log(1);
                if (this._cut == null) {
                    this.stop();
                    return true;
                }
                this._sourceFrame = this._cut.sourceStart;
                this._buffers[0].clear();
                this._buffers[1].clear();
                this.calculateEffectiveValues(this._cut.tempo, this._cut.pitch);
                this._chunkSize = this._stretch.inputChunkSize;
                this._buffers[0].putSamples(this._interleave, this._sourceFrame, this._chunkSize);
                this._sourceFrame += this._chunkSize;
            }
            console.log(this._buffers[2].frameCount);
            const nF = Math.min(Math.floor(128 * this._stretch.tempo), this._interleave.length / 2 - this._sourceFrame);
            this._buffers[0].putSamples(this._interleave, this._sourceFrame, nF);
            this._sourceFrame += nF;
            console.log(this._sourceFrame);
            if (this._transposer.rate > 1) {
                this._stretch.process();
                this._transposer.process();
            } else {
                this._transposer.process();
                this._stretch.process();
            }
            this._buffers[2].receiveSamples(output, 128);
            outputs[0].forEach((channel, num) => {
                for (let i = 0; i < channel.length; i++) {
                    channel[i] = output[2 * i + num] * params['customGain'][0];
                }
            });
            this.update();
        } else {
            output.forEach((channel) => {
                for (let i = 0; i < channel.length; i++) {
                    channel[i] = 0;
                }
            });
        }
        return true;
    }

    // The parameter descripter that gets passed into the 'params' argument when processing
    static get parameterDescriptors() {
        return [{
            name: 'customGain',
            defaultValue: 1,
            minValue: 0,
            maxValue: 2,
            automationRate: 'k-rate'
        }]
    }

}
registerProcessor('CustomGainProcessor', TestProcessor);