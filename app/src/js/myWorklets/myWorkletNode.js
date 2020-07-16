export default class MyWorkletNode extends AudioWorkletNode {
    constructor(context, processor) {
        super(context, processor)
        this.port.onmessage = this._messageProcessor.bind(this);
    }

    _messageProcessor(e) {
        let data = e.data;
        console.log("MESSAGE: " + data);
    }

}