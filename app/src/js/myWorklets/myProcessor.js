
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
        this._initialized = false;
        this._frame = 0;
        this._paused = false;
        // The buffer parsed to the output after undergoing some processing
        this._samples = new Float32Array(2 * 128)
        this.port.onmessage =  (e) => {
            const msg = e.data;
            let title = msg.title;
            let data = msg.data;
            if ( "Begin" === title ) {
                this._bufferInfo = data;
                this.port.postMessage({
                    title: "Ready",
                    data: "Processor is ready"
                })
                this._initialized = true;
            }

            if ( "Update" === title ) {
                this._paused = data.paused
            }
        }
        this.port.postMessage({
            title: "Initialised",
            data: "Ready to take information"
        })
    }


    update() {
        this._frame += 1;
        this.port.postMessage({
            title: "Position",
            data:  {
                time: this._frame
            }
        })
    }

    process(inputs, outputs, params) {
        if (!this._initialized || !inputs[0].length) return true;
        const input = inputs[0]
        const output = outputs[0]
        output.forEach((channel, num) => {
            for ( let i = 0; i < channel.length; i++ ) {
                channel[i] = input[num][i]*params['customGain'][0]
            }
        })
        if ( !this._paused ) this.update();
        return true
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