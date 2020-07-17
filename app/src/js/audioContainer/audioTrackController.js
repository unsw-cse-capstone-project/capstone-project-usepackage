/*
    Each audio file is liable to an AudioTrack,
    it contains methods for recording the track with changes
    added in by the user as well as components specific to each audio track.
    Audio track components usually consist of things like gain and pitch which can be 
    modified by sections
*/

import MyWorkletNode from '../myWorklets/myWorkletNode';

export default class AudioTrackController {

    constructor(props) {
        // Elements required for controlling audio source ( including the source )
        this.audioRecord = props.audioRecord
        this.source = props.source
        this.graph = props.graph
        this.audioCtx = props.audioCtx
        this.audioElement = props.audioElement

        this.toggle = this.toggle.bind(this)
        this.gain = this.gain.bind(this)
        this.connectAll = this.connectAll.bind(this)
        this.connectAll()
        this.inprogress = false;
    }

    toggle(nameCb) {
        if ( this.inprogress )  {
            this.audioElement.pause()
            this.inprogress = false;
            nameCb("Play")
        }
        else {
            this.audioElement.play()
            this.inprogress = true;
            nameCb("Pause")
        }
    }

    seek(val) {

    }

    gain(val) {
        console.log("Changing the gain")
        const gainParam = this.graph.gain.parameters.get('customGain')
        gainParam.setValueAtTime(val, this.audioCtx.currentTime)
    }

    connectAll() {
        console.log("Graph connected")
        this.source.connect(this.graph.gain)
        this.graph.gain.connect(this.audioCtx.destination)
    }

}

AudioTrackController.create = (audioRecord) => {
    return new Promise((resolve) => {
        console.log("Creating a new controller with record: ", audioRecord)
        const audioCtx = new AudioContext()
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
    return audioCtx.audioWorklet.addModule('./myProcessor.js').then(() => {
        const gainNode = new MyWorkletNode(audioCtx, 'CustomGainProcessor', buffer);
        return new Promise((resolve) => {
            gainNode.on('init', (detail) => {
                console.log("MSG: ", detail)
                resolve({gain: gainNode})
            })
        })
        // return {gain: gainNode}
    })
}