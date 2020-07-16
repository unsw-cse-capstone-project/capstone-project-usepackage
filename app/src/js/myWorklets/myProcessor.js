
// myProcessor.js
class TestProcessor extends AudioWorkletProcessor {

    constructor() {
        super();
        this.data = {
            inprogress: true
        };
        this.port.onmessage = this._messageProcessor.bind(this);
        this.port.postMessage("This is a message")
    }

    process(inputs, outputs, params) {
        const input = inputs[0]
        const output = outputs[0]
        output.forEach((channel, num) => {
            for (let i = 0; i < channel.length; i++) {
                channel[i] = input[num][i]*params['customGain'][0]
            }
        })
        return this.data.inprogress
    }


    _messageProcessor(e) {
        let data = e.data;
        console.log(data)
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
}
registerProcessor('CustomGainProcessor', TestProcessor);