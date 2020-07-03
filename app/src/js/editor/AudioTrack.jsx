import createSoundTouchNode from '../soundtouch/createSoundTouchNode.js';
import WavAudioEncoder from '../soundtouch/WavAudioEncoder.js'
import PromiseQueue from '../PromiseQueue.jsx';

const lamejs = window.lamejs;
const Encoder = window.Encoder;

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
        this.playFrom = this.playFrom.bind(this);
        this.setGain = this.setGain.bind(this);
        this.processData = this.processData.bind(this);
        this.playback = this.playback.bind(this);
        this.setPitch = this.setPitch.bind(this);
        this.toBuffer = this.toBuffer.bind(this);
        this.getAnalyser = this.getAnalyser.bind(this);
        this.processData(data);
        this.wipeData = this.wipeData.bind(this);
        this.record = this.record.bind(this);
        window.play = this.playFrom;
        this.attachAnalyser = null;
        this.currentCut = 0;
        //this.cut(this.buffer.sampleRate * 3);
    }

    setAnalyserCallback(cb) {
        this.attachAnalyser = cb;
    }

    //track contents
    // graph: AudioGraph (Contains nodes),
    // time: Initial time,
    // length: Number of samples in cut segment

    // Convert a length of the audioBuffer into a separate track?
    toBuffer(track) {
        const pitch = this.controller.pitchVal;
        const tempo = this.controller.tempoVal;
        const rate = this.fileData.audioBuffer.sampleRate;
        console.log("Length", track.length);
        console.log("Context size", Math.ceil(track.length / tempo));
        const context = new OfflineAudioContext(2, Math.ceil(track.length / tempo), rate);
        return context.audioWorklet.addModule('/soundtouch/soundtouch-worklet.js').then(() => {
            const buffer = context.createBuffer(2, track.length, rate);
            buffer.copyToChannel(this.fileData.audioBuffer.getChannelData(0).slice(track.time), 0);
            buffer.copyToChannel(this.fileData.audioBuffer.getChannelData(1).slice(track.time), 1);
            const soundtouch = createSoundTouchNode(context, AudioWorkletNode, buffer);
            const graph = this.copy(track.graph, context);
            return new Promise((resolve) => {
                soundtouch.on('initialized', () => {
                    soundtouch.tempo = tempo;
                    soundtouch.pitch = pitch;
                    const buff = soundtouch.connectToBuffer();
                    soundtouch.connect(graph.splitter);
                    graph.merger.connect(context.destination);
                    buff.start();
                    context.startRendering().then((buff) => {
                        console.log("End length", buff.length);
                        resolve(buff);
                    });
                });
            })
        });
    }

    record() {
        const queue = new PromiseQueue();
        this.cuts.forEach((track) => {
            queue.add((arr) => {
                return this.toBuffer(track).then((data) => {
                    console.log([...arr, data.getChannelData(0), data.getChannelData(1)]);
                    return [...arr, data];
                });
            });
        });
        return queue.resolve([]).then((buffs) => {
            const size = buffs.reduce((prev, next) => {
                return prev + next.length;
            }, 0);
            const buffer = this.context.createBuffer(2, size, this.fileData.audioBuffer.sampleRate);
            let offset = 0;
            buffs.forEach((buff) => {
                for (let i = 0; i < 2; i++)
                    buffer.copyToChannel(buff.getChannelData(i), i, offset);
                offset += buff.length;
            });
            return buffer;
        });
    }

    getTime() {
        // let currTime;
        // this.controller.on('play', detail => {
        //     // 16384/44100s
        //     currTime = detail.formattedTimePlayed
        // })
        return 
    }

    get CurrentCut() {
        return this.currentCut
    }

    get rate() {
        return this.buffer.sampleRate;
    }

    set CurrentCut(val) {
        this.currentCut = val
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
        this.cuts[this.currentCut].graph.gain[channel].gain.value = value;
    }

    getGain(channel) {
        return this.cuts[this.currentCut].graph.gain[channel].gain.value;
    }

    playback(value) {
        this.controller.tempo = value;
    }

    setPitch(value) {
        this.controller.pitch = value;
    }

    playFrom(time) {
        time = Math.floor(time * this.buffer.sampleRate);
        const tempo = this.controller.tempoVal;
        const pitch = this.controller.pitchVal;
        if (this.inprogress) {
            this.controller.stop();
            this.controller.cutCallback(null);
            this.controller.disconnect();
            this.controller.disconnectFromBuffer();
            this.controller.off('play');
            this.inprogress = false;
        }
        this.wipeData();
        this.buffer = this.fileData.audioBuffer;
        const newbuff = this.context.createBuffer(2, this.buffer.length - time, this.buffer.sampleRate);
        newbuff.copyToChannel(this.buffer.getChannelData(0).slice(time), 0);
        newbuff.copyToChannel(this.buffer.getChannelData(1).slice(time), 1);
        const newdata = {...this.fileData,
            audioBuffer: newbuff
        };
        AudioTrack.newNode(newdata).then((data) => {
            this.processData(data);
            this.controller.tempo = tempo;
            this.controller.pitch = pitch;
            this.cuts.forEach((cut) => {
                cut.graph = this.copy(cut.graph);
            });
            this.play(time);
        });
    }

    

    play(time = 0) {
        const controllerNode = this.controller;
        if (this.inprogress) {
            controllerNode.play();
            return;
        }
        const calls = this.cuts.filter((cut) => {
            return cut.time + cut.length > time;
        }).map((cut, index) => {
            return {
                cut: cut,
                callback: (time) => {
                    console.log("TRANSITION MADE", time);
                    controllerNode.disconnect();
                    cut.graph.merger.disconnect();
                    if (calls.length == 0) {
                        controllerNode.disconnectFromBuffer();
                        return;
                    }
                    controllerNode.connect(this.cuts[index + 1].graph.splitter);
                    this.cuts[index + 1].graph.merger.connect(this.context.destination);
                    if (this.attachAnalyser)
                        this.attachAnalyser(this.cuts[index + 1].graph.analyser);
                    const call = calls.shift();
                    controllerNode.makeCallback(call.time).then(call.callback);
                    controllerNode.cutCallback(() => {
                        this.cuts[index + 1].graph.merger.disconnect();
                    });
                },
                time: cut.time + cut.length - time
            }
        });
        const call = calls.shift();
        controllerNode.makeCallback(call.time).then(call.callback);
        controllerNode.cutCallback(() => {
            call.cut.graph.merger.disconnect();
        });
        call.cut.graph.merger.connect(this.context.destination);
        const buff = controllerNode.connectToBuffer();
        if (this.attachAnalyser)
            this.attachAnalyser(call.cut.graph.analyser);
        controllerNode.connect(call.cut.graph.splitter);
        controllerNode.play();
        buff.start(0, time / this.buffer.sampleRate);
        this.inprogress = true;
    }

    pause() {
        this.controller.pause();
    }

    stop() {
        const tempo = this.controller.tempoVal;
        const pitch = this.controller.pitchVal;
        this.controller.stop();
        this.controller.cutCallback(null);
        this.controller.disconnect();
        this.controller.disconnectFromBuffer();
        this.controller.off('play');
        this.inprogress = false;
        this.wipeData();
        AudioTrack.newNode(this.fileData).then((data) => {
            this.processData(data);
            this.controller = data.controller;
            this.controller.tempo = tempo;
            this.controller.pitch = pitch;
            this.cuts.forEach((cut) => {
                cut.graph = this.copy(cut.graph);
            });
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