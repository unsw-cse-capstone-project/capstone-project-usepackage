
// myProcessor.js
class TestProcessor extends AudioWorkletProcessor {

    constructor() {
        super();
        this._bufferInfo = {};
        this.port.onmessage = this._messageProcessor.bind(this);
        this.port.postMessage({
            title: "Initialised",
            data: "Ready to take information"
        })
    }

    process(inputs, outputs, params) {
        const input = inputs[0]
        const output = outputs[0]
        output.forEach((channel, num) => {
            for ( let i = 0; i < channel.length; i++ ) {
                channel[i] = input[num][i]
            }
        })
        return true
    }

    static get parameterDescriptors () {
        return [{
          name: 'customGain',
          defaultValue: 1,
          minValue: 0,
          maxValue: 2,
          automationRate: 'k-rate'
        }]
    }


    _messageProcessor(e) {
        const msg = e.data;
        let title = msg.title;
        let data = msg.data;
        if ( "Begin" === title ) {
            this._bufferInfo = data;
            this.port.postMessage({
                title: "Ready",
                data: this._bufferInfo
            })
        }
    }

}
registerProcessor('CustomGainProcessor', TestProcessor);