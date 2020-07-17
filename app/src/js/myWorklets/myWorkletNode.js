export default class MyWorkletNode extends AudioWorkletNode {
    constructor(context, processor, buffer) {
        super(context, processor);
        this._buffer = buffer;
        this.listeners = [];
        // this.on = this.on.bind(this) 
        // this.off = this.off.bind(this)
        this._initializeProcessor = this._initializeProcessor.bind(this);
        this.port.onmessage = this._messageProcessor.bind(this);
    }  


    /* event listener handling */
    /**
     * @on
     * @param {String} eventName - name of new event listener to 'addEventListener'
     * @param {Function} cb - the callback of the new event listener
     * Event listeners are also stored in an array, for use by 'off()'
     */
    on(eventName, cb) {
        this.listeners.push({ name: eventName, cb: cb });
        this.addEventListener(eventName, (event) => cb(event.detail));
    }

    /**
     * @off
     * @param {null|String} eventName - the 'name of the event listener to remove (removeEventListener)
     *   If a 'name' is passed, we find all of the listeners with that name, in the listeners array, and remove them.
     *   If no 'name' was passed, we remove all of the event listeners in the listeners array
     */
    off(eventName = null) {
        let listeners = this.listeners;
        if (eventName) {
            listeners = listeners.filter((e) => e.name === eventName);
        }
        listeners.forEach((e) => {
            this.removeEventListener(e.name, (event) => e.cb(event.detail));
        });
    }
    /* end event listener handling */

    _initializeProcessor(data) {
        return {
            sampleRate: data.sampleRate,
            duration: data.duration,
            numberOfChannels: data.numberOfChannels,
            length: data.length,
            channelOne: data.getChannelData(0),
            channelTwo: data.numberOfChannels > 1 ? data.getChannelData(1) : data.getChannelData(0)
        }
    }

    _messageProcessor(e) {
        const msg = e.data;
        let title = msg.title;
        let data = msg.data;
        if ( "Initialised" === title ) {
            this.port.postMessage({
                title: "Begin",
                data: this._initializeProcessor(this._buffer)
            })
        }
        if ( "Ready" === title ) {
            let init = new CustomEvent("init", {
                detail: data
            })
            this.dispatchEvent(init);
        }
    }

}