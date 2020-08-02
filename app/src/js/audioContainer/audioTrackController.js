/*
    Each audio file is liable to an AudioTrack,
    it contains methods for recording the track with changes
    added in by the user as well as components specific to each audio track.
    Audio track components usually consist of things like gain and pitch which can be 
    modified by sections
*/

import workletURL from '../myWorklets/custom.worklet.js';
import MyWorkletNode from '../myWorklets/myWorkletNode';
import lamejs from '../lib/lamejs.js';

export default class AudioTrackController {

    constructor(props) {
        // Elements required for controlling audio source ( including the source )
        this.audioRecord = props.audioRecord
        this.source = props.source
        this.node = props.node
        this.audioCtx = props.audioCtx
        this.audioElement = props.audioElement
        this._analyser = props.analyser;

        // Callbacks
        this._timeCb = null;
        this._buttonNameCb = null;
        // Functions bindings
        this.toggle = this.toggle.bind(this);
        this.gain = this.gain.bind(this);
        this.time = this.time.bind(this);
        this.registerLength = this.registerLength.bind(this);
        this.registerPos = this.registerPos.bind(this);
        this.seek = this.seek.bind(this);
        this.connectAll = this.connectAll.bind(this);
        this.connectAll();
        this.inprogress = false;
        this.lengthHandle = null;
        this.posHandle = null;
        this.stack = null;

        this.node.on('stack', (detail) => {
            this.stack = detail;
        });

        this.node.on('stop', () => {
            this.toggle("Play", true);
        });
        this.registerLength = this.registerLength.bind(this);
        this.registerPos = this.registerPos.bind(this);
        this.seek = this.seek.bind(this);
    }

    get waveform() {
        return this.audioRecord.audioData;
    }

    getStack() {
        this.node.getStack()
        return this.stack
    }

    seek(slice, time) {
        this.node.seek(slice, time);
    }

    registerLength(handler) {
        this.node.on('length', (detail) => {
            handler(detail);
        });
        this.node.getLengths();
    }

    registerPos(handler) {
        this.node.on('pos', (detail) => {
            handler(detail);
        });
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
        if (this.audioCtx.state === 'suspended') {
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
        this.node.toggle(this.inprogress);
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

    get analyser() {
        return this._analyser;
    }

    time() {
        this.timeCb(this.node.getTime())
    }

    gain(val, channel, cut) {
        this.node.setGain(val, channel, cut);
    }

    tempo(val, cut) {
        this.node.setTempo(val, cut);
    }

    pitch(val, cut) {
        this.node.setPitch(val, cut);
    }

    connectAll() {
        this.source.connect(this.node)
        this.node.connect(this._analyser);
        this._analyser.connect(this.audioCtx.destination);
        console.log("Graph connected"); // DEBUG
    }

    executeCut(timeSample) {
        this.node.executeCut(timeSample);
    }

    undo() {
        this.node.undo();
    }

    redo() {
        this.node.redo();
    }

    crop(slice) {
        this.node.crop(slice);
    }

    copy(slice, destination) {
        this.node.copy(slice, destination);
    }

    move(slice, destination) {
        this.node.move(slice, destination);
    }

}

AudioTrackController.create = (audioRecord) => {
    return new Promise((resolve) => {
        console.log("Creating a new controller with record: ", audioRecord)
        const audioCtx = new AudioContext();
        AudioTrackController.graph(audioCtx, audioRecord.audioData).then(graph => {
            console.log("Graph: ", graph)
                // Create the source
            const audio = new Audio(URL.createObjectURL(audioRecord.fileBlob));
            const source = audioCtx.createMediaElementSource(audio);
            const analyser = audioCtx.createAnalyser();
            resolve(new AudioTrackController({
                audioRecord: audioRecord,
                audioElement: audio,
                audioCtx: audioCtx,
                source: source,
                analyser: analyser,
                node: graph
            }))
        })
    })
}

AudioTrackController.graph = (audioCtx, buffer) => {
    // const gainNode = new GainNode(audioCtx);
    return audioCtx.audioWorklet.addModule(workletURL).then(() => {
        const workNode = new MyWorkletNode(audioCtx, 'CustomProcessor', {
            buffer: buffer
        });
        return new Promise((resolve) => {
                workNode.on('init', (detail) => {
                    console.log("MSG: ", detail)
                    resolve(workNode);
                })
            })
            // return {gain: gainNode}
    })
}