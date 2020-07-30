export default class MyWorkletNode extends AudioWorkletNode {
    /*
        The options parameters is an object that we can freely manipulate to add stuff
    */
    constructor(context, processor, options) {
        super(context, processor);
        this._buffer = options.buffer;
        this.listeners = [];
        this.time = 0;
        this.port.onmessage = this._messageProcessor.bind(this);
    }

    seek(slice, time) {
        console.log("SLICE in node");
        this.port.postMessage({
            title: "Seek",
            data: {
                slice: slice,
                time: time
            }
        })
    }

    getStack() {
        this.port.postMessage({
            title: "getStack"
        })
    }

    getTime() {
        return this.time
    }

    getLengths() {
        this.port.postMessage({
            title: "Lengths"
        });
    }

    executeCut(timeSample) {
        this.port.postMessage({
            title: "Cut",
            data: timeSample
});
        console.log("Executing cut in myWorkletNode");
    }

    setTempo(val, cut) {
        this.port.postMessage({
            title: "Tempo",
            data: {
                index: cut,
                value: val
            }
        })
    }

    setGain(val, channel, cut) {
        this.port.postMessage({
            title: "Gain",
            data: {
                index: cut,
                channel: channel,
                value: val
            }
        })
    }

    setPitch(val, cut) {
        this.port.postMessage({
            title: "Pitch",
            data: {
                index: cut,
                value: val
            }
        })
    }

    crop(slice) {
        this.port.postMessage({
            title: "Crop",
            data: slice
        })
    }

    copy(slice, destination) {
        this.port.postMessage({
            title: "Copy",
            data: {
                from: slice,
                to: destination
            }
        })
    }

    move(slice, destination) {
        this.port.postMessage({
            title: "Move",
            data: {
                from: slice,
                to: destination
            }
        })
    }

    undo() {
        this.port.postMessage({ title: "Undo" });
    }

    redo() {
        this.port.postMessage({ title: "Redo" });
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

    /*
        The possible return values for messaging are:
        Initialised: This tells us when the processor has its constructer updated with the relevant information as well as general setup
        Ready: This is called back after the initialised state, and is used simply to let the user know that they can start to use the processor
        Position: Updates the user with the current buffer position
    */
    _messageProcessor(e) {
        const msg = e.data;
        let title = msg.title;
        let data = msg.data;

        // From the processor
        if ("Initialised" === title) {
            this.port.postMessage({
                title: "Begin",
                data: this._initializeProcessor(this._buffer)
            })
        }
        if ("Ready" === title) {
            let init = new CustomEvent("init", {
                detail: data
            })
            this.dispatchEvent(init);
            return;
        }
        if ("returnStack") {
            console.log("STACK IS CURRENTLY: ", data)
            let stack = new CustomEvent("stack", {
                detail: data
            })
            this.dispatchEvent(stack);
            return;
        }

        if ("Position" === title) {
            this.time = data.time
            let pos = new CustomEvent("pos", {
                detail: data
            })
            this.dispatchEvent(pos);
            return;
        }

        // From the container
        if ("Update" === title) {
            this.port.postMessage({
                title: "Update",
                data: this.data
            })
        }

        if ("Stop" === title) {
            this.time = data.time
            let stop = new CustomEvent("stop", {
                detail: "Stop"
            })
            this.dispatchEvent(stop);
            return;
        }

        if ("Lengths" === title) {
            let length = new CustomEvent("lengthUpdate", {
                detail: data
            });
            this.dispatchEvent(length);
            return;
        }
    }
}