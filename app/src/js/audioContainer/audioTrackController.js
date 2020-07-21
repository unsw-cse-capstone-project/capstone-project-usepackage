/*
    Each audio file is liable to an AudioTrack,
    it contains methods for recording the track with changes
    added in by the user as well as components specific to each audio track.
    Audio track components usually consist of things like gain and pitch which can be 
    modified by sections
*/

import MyWorkletNode from '../myWorklets/myWorkletNode';

const lamejs = window.lamejs;

export default class AudioTrackController {

    constructor(props) {
        // Elements required for controlling audio source ( including the source )
        this.audioRecord = props.audioRecord
        this.source = props.source
        this.graph = props.graph
        this.audioCtx = props.audioCtx
        this.audioElement = props.audioElement

        // Callbacks
        this._timeCb = null;
        this._buttonNameCb = null;
        // Functions bindings
        this.toggle = this.toggle.bind(this);
        this.gain = this.gain.bind(this);
        this.time = this.time.bind(this);
        this.connectAll = this.connectAll.bind(this);
        this.connectAll();
        this.inprogress = false;
        this.lengthHandle = null;
        this.posHandle = null;
        this.graph.node.on('stop', (detail) => {
            this.toggle(detail, true)
        });
        this.graph.node.on('lengthUpdate', (detail) => {
            if (this.lengthHandle)
                this.lengthHandle(detail);
        });
        this.graph.node.on('pos', (detail) => {
            if (this.posHandle)
                this.posHandle({ pos: detail.time });
        })
    }

    record() {
        // Time to do the recording
        let buffer = this.audioRecord.audioData
        console.log("Recording buffer...", buffer)
        const encoder = new lamejs.Mp3Encoder(2, buffer.sampleRate, 128);
        let mp3Data = [];
        let mp3buf;
        const sampleBlockSize = 576;

        function FloatArray2Int16(floatbuffer) {
            var int16Buffer = new Int16Array(floatbuffer.length);
            for (var i = 0, len = floatbuffer.length; i < len; i++) {
                if (floatbuffer[i] < 0) {
                    int16Buffer[i] = 0x8000 * floatbuffer[i];
                } else {
                    int16Buffer[i] = 0x7FFF * floatbuffer[i];
                }
            }
            return int16Buffer;
        }
        const left = FloatArray2Int16(buffer.getChannelData(0));
        const right = FloatArray2Int16(buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : buffer.getChannelData(0));
        for (let i = 0; i < buffer.length; i += sampleBlockSize) {
            let leftChunk = left.subarray(i, i + sampleBlockSize);
            let rightChunk = right.subarray(i, i + sampleBlockSize);
            mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }
        }
        mp3buf = encoder.flush();
        if (mp3buf.length > 0)
            mp3Data.push(mp3buf);
        return new Blob(mp3Data, { type: 'audio/mp3' });
    }

    toggle(name, paused) {
        if(this.audioCtx.state === 'suspended') {
            this.audioCtx.resume()
        }

        if (this.inprogress) {
            this.audioElement.pause()
            this.inprogress = false;
            this._buttonNameCb(name, paused)
        } else {
            this.audioElement.play()
            this.inprogress = true;
            this._buttonNameCb(name, paused)
        }
        this.graph.node.port.postMessage({
            title: "Update",
            data: {
                paused: !this.inprogress
            }
        })
    }

    get buttonNameCb() {
        return this._buttonNameCb
    }

    set buttonNameCb(buttonCb) {
        this._buttonNameCb = buttonCb
    }

    get timeCb() {
        return this._timeCb
    }
    set timeCb(timeCb) {
        this._timeCb = timeCb
    }

    time() {
        this.timeCb(this.graph.node.getTime())
    }

    seek(val) {

    }

    gain(val, channel, cut) {
        this.graph.node.setGain(val, channel, cut);
    }

    tempo(val, cut) {
        this.graph.node.setTempo(val, cut);
    }

    pitch(val, cut) {
        this.graph.node.setPitch(val, cut);
    }

    connectAll() {
        console.log("Graph connected")
        this.source.connect(this.graph.node)
        this.graph.node.connect(this.audioCtx.destination)
    }

    executeCut(timeSample) {
        this.graph.node.executeCut(timeSample);
        console.log("Executing cut in audioTrackController");
    }

    undo() {
        this.graph.node.undo();
    }

    redo() {
        this.graph.node.redo();
    }

    crop(slice) {
        this.graph.node.crop(slice);
    }

    copy(slice, destination) {
        this.graph.node.copy(slice, destination);
    }

    move(slice, destination) {
        this.graph.node.move(slice, destination);
    }

}

AudioTrackController.create = (audioRecord) => {
    return new Promise((resolve) => {
        console.log("Creating a new controller with record: ", audioRecord)
        const audioCtx = new AudioContext();
        AudioTrackController.graph(audioCtx, audioRecord.audioData).then(graph => {
            console.log("Graph: ", graph)
                // Create the source
            const audio = new Audio(URL.createObjectURL(audioRecord.fileBlob))
            const source = audioCtx.createMediaElementSource(audio)
            resolve(new AudioTrackController({
                audioRecord: audioRecord,
                audioElement: audio,
                audioCtx: audioCtx,
                source: source,
                graph: graph
            }))
        })
    })
}

AudioTrackController.graph = (audioCtx, buffer) => {
    // const gainNode = new GainNode(audioCtx);
    return audioCtx.audioWorklet.addModule('/myProcessor.js').then(() => {
        const workNode = new MyWorkletNode(audioCtx, 'CustomGainProcessor', {
            buffer: buffer
        });
        return new Promise((resolve) => {
                workNode.on('init', (detail) => {
                    console.log("MSG: ", detail)
                    resolve({ node: workNode })
                })
            })
            // return {gain: gainNode}
    })
}