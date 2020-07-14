
// myProcessor.js
class TestProcessor extends AudioWorkletProcessor {

    constructor() {
        super();
        this.data = {
            inprogress: true
        };
        this.port.onmessage = (event) => {
            this.data = event.data
        }
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