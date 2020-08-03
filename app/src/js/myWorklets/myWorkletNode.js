import MsgType from './messageTypes.js';

export default class MyWorkletNode extends AudioWorkletNode {
    constructor(context, processor, options) {
        super(context, processor);
        this._buffer = options.buffer;
        this._cuts = options.cuts;
        this._stack = options.stack;
        this.listeners = [];
        this.time = 0;
        this.port.onmessage = this._messageProcessor.bind(this);
    }

    // Seek to a slice with a given offset time
    seek(slice, time) {
        this.port.postMessage({
            type: MsgType.SEEK,
            data: {
                slice: slice,
                time: time
            }
        })
    }

    // Request the stack from the worklet
    getStack() {
        this.port.postMessage({
            type: MsgType.STACK
        })
    }

    // Get update for sliders
    getUpdate(index) {
        this.port.postMessage({
            type: MsgType.UPDATE,
            data: index
        });
    }

    // Get the current time
    getTime() {
        return this.time
    }

    // Request a list of lengths after tempo application
    getLengths() {
        this.port.postMessage({
            type: MsgType.LENGTH
        });
    }

    // Create a cut at the given time in samples
    executeCut(timeSample) {
        this.port.postMessage({
            type: MsgType.CUT,
            data: timeSample
        });
    }

    // Set the tempo of a cut
    setTempo(val, cut) {
        this.port.postMessage({
            type: MsgType.TEMPO,
            data: {
                index: cut,
                value: val
            }
        })
    }

    // Set the gain of a cut, of a channel
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

    // Set the pitch of a cut
    setPitch(val, cut) {
        this.port.postMessage({
            type: MsgType.PITCH,
            data: {
                index: cut,
                value: val
            }
        })
    }

    // Crop a cut out
    crop(slice) {
        this.port.postMessage({
            type: MsgType.CROP,
            data: slice
        })
    }

    // Copy a cut and insert the new cut elsewhere
    copy(slice, destination) {
        this.port.postMessage({
            type: MsgType.COPY,
            data: {
                from: slice,
                to: destination
            }
        })
    }

    // Move a cut to a new position
    move(slice, destination) {
        this.port.postMessage({
            type: MsgType.MOVE,
            data: {
                from: slice,
                to: destination
            }
        })
    }

    // Move the cut boundary, truncating
    moveCut(slice, offset) {
        this.port.postMessage({
            type: MsgType.MOVECUT,
            data: {
                index: slice,
                offset: offset
            }
        })
    }

    // Undo an action
    undo() {
        this.port.postMessage({
            type: MsgType.UNDO
        });
    }

    // Redo an action
    redo() {
        this.port.postMessage({
            type: MsgType.REDO
        });
    }

    // Toggle/set whether the node is playing
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

    // Process the provided data into a structure useful for the processor worklet
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

    // Process the various messages received from the processor worklet
    _messageProcessor(e) {
        const msg = e.data;
        const data = msg.data;

        switch (msg.type) {
            case MsgType.INIT:
                // Once it's initialised, we can send it the data it needs to process
                this.port.postMessage({
                    type: MsgType.START,
                    data: {
                        ...this._initializeProcessor(this._buffer),
                        cuts: this._cuts,
                        stack: this._stack
                    }
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

            case MsgType.UPDATE:
                this.dispatchEvent(new CustomEvent("gainL", {
                    detail: data.gain[0] * 50
                }));
                this.dispatchEvent(new CustomEvent("gainR", {
                    detail: data.gain[1] * 50
                }));
                this.dispatchEvent(new CustomEvent("tempo", {
                    detail: 100 * (2 * data.tempo - 1) / 3
                }));
                this.dispatchEvent(new CustomEvent("pitch", {
                    detail: 100 * (2 * data.pitch - 1) / 3
                }));
                return;

            default:
                console.log("Unknown message type in node", msg.type);
                return;
        }
    }
}