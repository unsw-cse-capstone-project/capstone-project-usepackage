import PitchShifter from '../modulator/PitchShifter';
const Recorder = window.Recorder;

export default class AudioStack {
    constructor () {
        this.files = [];
        this.newFile = this.newFile.bind(this);
        this.genOnline = this.genOnline.bind(this);
        this.genOffline = this.genOffline.bind(this);
        this.getControl = this.getControl.bind(this);
        this.setGain = this.setGain.bind(this);
        this.setPlayback = this.setPlayback.bind(this);
        this.getAnalyser = this.getAnalyser.bind(this);
    }

    getControl(index) {
        return this.files[index].online.audio;
    }

    setGain(value, index) {
        this.files[index].online.gain.value = value;
        this.files[index].offline.gain.value = value;
    }

    setPlayback(rate, index) {
        this.files[index].online.audio.playbackRate = rate;
        this.files[index].offline.source.playbackRate.value = rate;
    }

    getAnalyser(index, channel) {
        return this.files[index].online.analyser[channel];
    }

    newFile(fileData) {
        const online = this.genOnline(fileData.audioBuffer);
        const offline = this.genOffline(fileData.audioBuffer);
        
        this.files.push({
            online: online,
            offline: offline
        });
    }

    genOnline(buffer) {
        const context = new AudioContext();
        const data = this.connectAll(context, buffer, context.destination, true);

        return {
            ...data,
            context: context
        };
    }

    genOffline(buffer) {
        const context = new OfflineAudioContext(2, buffer.length, buffer.sampleRate);
        const data = this.connectAll(context, buffer, context.destination, false);
        const recorder = new Recorder(data.shifter.node);
    
        return {
            ...data,
            context: context,
            recorder: recorder
        }
    }

    connectAll(ctx, buffer, dest, analyse=true) {
        const shifter = new PitchShifter(ctx, buffer, 16384);
        const splitter = context.createChannelSplitter(2);
        const gain = [context.createGain(), context.createGain()];
        const analyser = null;
        if (analyse)
            analyser = [context.createAnalyser(), context.createAnalyser()];
        const merger = context.createChannelMerger(2);

        shifter.connect(splitter);
        for (let i = 0; i < 2; i++) {
            splitter.connect(gain[i], i);
            if (analyse) {
                gain[i].connect(analyser[i]);
                analyser[i].connect(merger, 0, i);
            } else {
                gain[i].connect(merger, 0, i);
            }
        }
        merger.connect(dest);

        return {
            shifter: shifter,
            splitter: splitter,
            gain: gain,
            analyser: analyser,
            merger: merger
        }
    }
}