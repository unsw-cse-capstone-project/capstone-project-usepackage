import MsgType from './messageTypes.js';

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
        this.port.postMessage({
            type: MsgType.SEEK,
            data: {
                slice: slice,
                time: time
            }
        })
    }

    getStack() {
        this.port.postMessage({
            type: MsgType.STACK
        })
    }

    getTime() {
        return this.time
    }

    getLengths() {
        this.port.postMessage({
            type: MsgType.LENGTH
        });
    }

    executeCut(timeSample) {
        this.port.postMessage({
            type: MsgType.CUT,
            data: timeSample
        });
        console.log("Executing cut in myWorkletNode");
    }

    setTempo(val, cut) {
        this.port.postMessage({
            type: MsgType.TEMPO,
            data: {
                index: cut,
                value: val
            }
        })
    }

    setGain(val, channel, cut) {
        this.port.postMessage({
            type: MsgType.GAIN,
            data: {
                index: cut,
                channel: channel,
                value: val
            }
        })
    }

    setPitch(val, cut) {
        this.port.postMessage({
            type: MsgType.PITCH,
            data: {
                index: cut,
                value: val
            }
        })
    }

    crop(slice) {
        this.port.postMessage({
            type: MsgType.CROP,
            data: slice
        })
    }

    copy(slice, destination) {
        this.port.postMessage({
            type: MsgType.COPY,
            data: {
                from: slice,
                to: destination
            }
        })
    }

    move(slice, destination) {
        this.port.postMessage({
            type: MsgType.MOVE,
            data: {
                from: slice,
                to: destination
            }
        })
    }

    undo() {
        this.port.postMessage({
            type: MsgType.UNDO
        });
    }

    redo() {
        this.port.postMessage({
            type: MsgType.REDO
        });
    }

    toggle(playing) {
        this.port.postMessage({
            type: MsgType.PLAY,
            data: playing
        })
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
        const channels = [
            data.getChannelData(0),
            data.numberOfChannels > 1 ? data.getChannelData(1) : data.getChannelData(0)
        ];
        const interleave = new Float32Array(data.length * 2);
        for (let i = 0; i < data.length; i++) {
            interleave[2 * i] = channels[0][i];
            interleave[2 * i + 1] = channels[1][i];
        }
        return {
            sampleRate: data.sampleRate,
            duration: data.duration,
            length: data.length,
            buffer: interleave
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
        const data = msg.data;

        switch (msg.type) {
            case MsgType.INIT:
                this.port.postMessage({
                    type: MsgType.START,
                    data: this._initializeProcessor(this._buffer)
                });
                break;

            case MsgType.READY:
                this.dispatchEvent(new CustomEvent("init", {
                    detail: data
                }));
                return;

            case MsgType.STACK:
                this.dispatchEvent(new CustomEvent("stack", {
                    detail: data
                }));
                return;

            case MsgType.POS:
                this.time = data.time;
                this.dispatchEvent(new CustomEvent("pos", {
                    detail: data
                }));
                return;

            case MsgType.STOP:
                this.time = 0;
                this.dispatchEvent(new CustomEvent("stop", {
                    detail: null
                }));
                return;

            case MsgType.LENGTH:
                this.dispatchEvent(new CustomEvent("length", {
                    detail: data
                }));
                return;

            default:
                console.log("Unknown message type in node", msg.type);
                return;
        }
    }
}