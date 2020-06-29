import createSoundTouchNode from '../soundtouch/createSoundTouchNode.js';
import WavAudioEncoder from '../soundtouch/WavAudioEncoder.js'

export default class AudioTrack {
    constructor (fileData, data) {
        this.fileData = fileData;
        this.inprogress = false;
        this.cuts = [data.cut];
        this.meta = data.meta;
        this.cut = this.cut.bind(this);
        this.split = this.split.bind(this);
        this.copy = this.copy.bind(this);
        this.play = this.play.bind(this);
        this.setGain = this.setGain.bind(this);
        this.processData = this.processData.bind(this);
        this.playback = this.playback.bind(this);
        this.setPitch = this.setPitch.bind(this);
        this.toBuffer = this.toBuffer.bind(this);
        this.getAnalyser = this.getAnalyser.bind(this);
        this.processData(data);
        this.wipeData = this.wipeData.bind(this);
        this.record = this.record.bind(this);
        window.record = this.record;
        //this.cut(this.buffer.sampleRate * 3);
    }

    //track contents
    // graph: AudioGraph (Contains nodes),
    // time: Initial time,
    // length: Number of samples in cut segment

    // Convert a length of the audioBuffer into a separate track?
    toBuffer(track) {
        const tempo = this.controller.tempoVal;
        const rate = this.buffer.sampleRate;
        const context = new OfflineAudioContext(2, Math.ceil(track.length / tempo), rate);
        return context.audioWorklet.addModule('/soundtouch/soundtouch-worklet.js').then(() => {
            let buffer = this.buffer;
            if (tempo < 1) {
                buffer = context.createBuffer(2, Math.ceil(track.length / tempo), rate);
                buffer.copyToChannel(this.buffer.getChannelData(0), 0);
                buffer.copyToChannel(this.buffer.getChannelData(1), 1);
            }
            const soundtouch = createSoundTouchNode(context, AudioWorkletNode, buffer);
            const graph = this.copy(track.graph, context);
            return new Promise((resolve) => {
                soundtouch.on('initialized', () => {
                    soundtouch.tempo = tempo;
                    const buff = soundtouch.connectToBuffer();
                    soundtouch.connect(graph.splitter);
                    graph.merger.connect(context.destination);
                    buff.start(0, track.time / rate, (track.length / tempo) / rate);
                    context.startRendering().then((buff) => {
                        const encode = new WavAudioEncoder(rate, 2);
                        encode.encode([buff.getChannelData(0), buff.getChannelData(1)]);
                        const blob = encode.finish();
                        console.log(blob);
                        resolve(blob);
                    });
                });
            })
        });
    }

    record() {
        const promises = [];
        this.cuts.forEach((track) => {
            promises.push((arr) => {
                return this.toBuffer(track).then((data) => {
                    console.log([...arr, data]);
                    return [...arr, data];
                });
            });
        });
        return promises.reduce((prev, curr) => {
            return prev.then(curr);
        }, Promise.resolve([]));
    // record() {
    //     const file = this.files[0].offline;
    //     file.soundtouch.connect(file.splitter);
    //     const buff = file.soundtouch.connectToBuffer();
    //     //const recorder = new Recorder(buff);
    //     //recorder.record();
    //     buff.start();
    //     file.context.startRendering().then((buff) => {
    //         console.log(buff);
    //         const encode = new WavAudioEncoder(44100, 2);
    //         encode.encode([buff.getChannelData(0), buff.getChannelData(1)]);
    //         const blob = encode.finish();
    //         console.log(buff.getChannelData(0));
    //         console.log(blob);

    //         //recorder.exportWAV((e) => {
    //         //     console.log(e);
    //         //     console.log(e.arrayBuffer());
    //             let a = document.createElement('a');
    //             a.download = 'test.wav';
    //             a.href = URL.createObjectURL(blob);
    //             a.innerText = "succ"
    //             document.body.appendChild(a);
    //         // })
    //     });
    // }
    }

    getTime() {
        // let currTime;
        // this.controller.on('play', detail => {
        //     // 16384/44100s
        //     currTime = detail.formattedTimePlayed
        // })
        return 
    }

    wipeData() {
        this.context.close();
    }

    processData(data) {
        this.context = data.context;
        this.controller = data.controller;
        this.buffer = data.buffer;
    }

    setGain(value, channel) {

        this.cuts[0].graph.gain[channel].gain.value = value;
    }

    playback(value) {
        this.controller.tempo = value;
    }

    setPitch(value) {
        this.controller.pitch = value;
    }

    play() {
        const controllerNode = this.controller;
        if (this.inprogress) {
            controllerNode.play();
            return;
        }
        const calls = this.cuts.map((cut, index) => {
            return {
                callback: (time) => {
                    controllerNode.disconnect();
                    cut.graph.merger.disconnect();
                    if (calls.length == 0) {
                        controllerNode.disconnectFromBuffer();
                        return;
                    }
                    controllerNode.connect(this.cuts[index + 1].graph.splitter);
                    this.cuts[index + 1].graph.merger.connect(this.context.destination);
                    const call = calls.shift();
                    controllerNode.makeCallback(call.time).then(call.callback);
                    controllerNode.cutCallback(() => {
                        this.cuts[index + 1].graph.merger.disconnect();
                    });
                },
                time: cut.time + cut.length
            }
        });
        const call = calls.shift();
        controllerNode.makeCallback(call.time).then(call.callback);
        controllerNode.cutCallback(() => {
            this.cuts[0].graph.merger.disconnect();
        });
        this.cuts[0].graph.merger.connect(this.context.destination);
        controllerNode.connectToBuffer();
        controllerNode.connect(this.cuts[0].graph.splitter);
        controllerNode.play();
        this.inprogress = true;
    }

    pause() {
        this.controller.pause();
    }

    stop() {
        this.controller.stop();
        this.controller.cutCallback(null);
        this.controller.disconnect();
        this.controller.disconnectFromBuffer();
        this.controller.off('play');
        this.inprogress = false;
        this.wipeData();
        AudioTrack.newNode(this.fileData).then((data) => {
            this.processData(data);
            this.cuts.forEach((cut) => {
                cut.graph = this.copy(cut.graph);
            })
        });
    }

    cut(time) {
        if (time <= 0)
            return false;
        let index = 0;
        let curr = 0;
        do {
            curr += this.cuts[index].length;
        } while (curr < time && ++index < this.cuts.length);
        console.log("curr", curr);
        console.log("time", time);
        console.log("index", index);
        if (curr == time || index >= this.cuts.length)
            return false;
        const split = this.split(this.cuts[index], time - curr + this.cuts[index].length);
        this.cuts.splice(index, 1, ...split);
        return split;
    }

    split(part, len) {
        return [
            {
                ...part,
                length: len
            },
            {
                graph: this.copy(part.graph),
                time: part.time + len,
                length: part.length - len
            }
        ];
    }

    copy(srcGraph, context=this.context) {
        const graph = AudioTrack.connectAll(context);
        for (let i = 0; i < 2; i++) {
            graph.gain[i].gain.value = srcGraph.gain[i].gain.value;
        }
        return graph;
    }

    getAnalyser(i) {
        return this.cuts[0].graph.analyser[i];
    }

    

}

AudioTrack.newNode = (fileData) => {
    const context = new AudioContext();
    return context.audioWorklet.addModule('/soundtouch/soundtouch-worklet.js').then(() => {
        const graph = AudioTrack.connectAll(context);
        const soundtouch = createSoundTouchNode(context, AudioWorkletNode, fileData.audioBuffer);
        return new Promise((resolve) => {
            soundtouch.on('initialized', () => {
                resolve({
                    buffer: fileData.audioBuffer,
                    context: context,
                    controller: soundtouch,
                    meta: {
                        name: fileData.fileName
                    },
                    cut: {
                        graph: graph,
                        time: 0,
                        length: fileData.audioBuffer.length
                    }
                });
            });
        });
    });
}

AudioTrack.create = (fileData) => {
    return AudioTrack.newNode(fileData).then((data) => {
        return new AudioTrack(fileData, data);
    })
};

AudioTrack.connectAll = (context) => {
    const splitter = context.createChannelSplitter(2);
    const gain = [context.createGain(), context.createGain()];
    const analyser = [context.createAnalyser(), context.createAnalyser()];
    const merger = context.createChannelMerger(2);

    for (let i = 0; i < 2; i++) {
        splitter.connect(gain[i], i);
        gain[i].connect(analyser[i]);
        analyser[i].connect(merger, 0, i);
    }

    return {
        splitter: splitter,
        gain: gain,
        analyser: analyser,
        merger: merger
    }
};