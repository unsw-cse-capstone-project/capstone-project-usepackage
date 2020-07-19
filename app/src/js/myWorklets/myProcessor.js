import Stretch from '/Stretch.js'

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
        this.time = [{
                start: 0,
                tempo: 1
            },
            {
                start: 690,
                tempo: 2
            }
        ];
        this._section = 0;
        this._interleave = null;
        this._initialized = false;
        this._frame = 0;
        this._playing = false;
        this._stretch = new Stretch(true);
        this._stretch.tempo = 1;
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
                console.log(this._interleave);
                this._initialized = true;
            }

            if ("Update" === title) {
                this._playing = !data.paused
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

    process(inputs, outputs, params) {
        if (!this._initialized) return true;
        let input = [this._bufferInfo.channelOne, this._bufferInfo.channelTwo];
        let output = new Float32Array(256);
        if (this._playing) {
            let i = 0;
            while (i < this.time.length && this.time[i].start <= this._frame)
                i++;
            i--;
            if (i >= this.time.length) {
                this.stop();
                return true;
            }
            if (this._frame - 1 < this.time[i].start || !this._frame) {
                console.log("TRANSITION", i);
                this._stretch.clear();
                this._stretch.tempo = this.time[i].tempo;
                let end = 0;
                if (i == this.time.length - 1)
                    end = this._bufferInfo.channelOne.length;
                else
                    end = this.time[i + 1].start * 128;
                let nF = end - this.time[i].start * 128;
                if (nF % this._stretch.inputChunkSize)
                    nF += this._stretch.inputChunkSize - (nF % this._stretch.inputChunkSize);
                console.log(nF);
                this._stretch.inputBuffer.putSamples(this._interleave, this._frame * 128, nF);
                this._stretch.process();
            }
            let remain = this._stretch.outputBuffer.receiveSamples(output, 128);
            if (!remain)
                this._section++;
            if (this._section >= this.time.length)
                this.stop();
            //console.log(output);
            outputs[0].forEach((channel, num) => {
                for (let i = 0; i < channel.length; i++) {
                    channel[i] = output[2 * i + num] * params['customGain'][0];
                }
            });
            this.update();
            if (this._frame * 128 >= this._bufferInfo.channelOne.length) {
                this.stop();
            }
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