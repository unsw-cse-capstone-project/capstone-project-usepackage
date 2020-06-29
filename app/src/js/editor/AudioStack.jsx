import React from 'react';
import PropTypes from 'prop-types';
import WavAudioEncoder from '../soundtouch/WavAudioEncoder.js';
import AudioTrack from './AudioTrack.jsx';
import AudioTrackContainer from './AudioTrackContainer.jsx';
import SlideController from './controller/SlideController.jsx';
import Button from 'react-bootstrap/Button';


const Recorder = window.Recorder;

export default class AudioStack extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            tracks: [],
            playing: false
        };
        this.trackControllers = [];
        this.togglePlay = this.togglePlay.bind(this);
        this.newFile = this.newFile.bind(this);
        this.stop = this.stop.bind(this);
        this.playBackHandler = this.playBackHandler.bind(this);
        window.doRecord = this.record;
    }

    togglePlay(target) {
        if ( target.dataset.playing==="false" ) {
            this.trackControllers.forEach(track => {
                track.play();
            })
            target.dataset.playing = "true";
            target.innerText = "⏸️";
        } else if ( target.dataset.playing==="true") {
            this.trackControllers.forEach(track => {
                track.pause()
            })
            target.dataset.playing ="false";
            target.innerText = "▶️";
        }
    }

    stop() {
        this.trackControllers.forEach(track => {
            track.stop();
        });
        const el = document.getElementById('audio-play-pause-button');
        el.dataset.playing ="false";
        el.innerText = "▶️";
    }

    playBackHandler(e) {
        this.trackControllers.forEach(track => {
            track.playback(e.value);
        })
    }

    // DO NOT DELETE
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
    // DO NOT DELETE

    // stopTrack(index) {
    //     const file = this.files[index];
    //     file.online.soundtouch.disconnect();
    //     file.online.soundtouch.disconnectFromBuffer();
    //     file.online.soundtouch.stop();
    //     file.playing = false;
    // }

    // getControl(index) {
    //     return this.files[index].online.audio;
    // }

    // setGain(value, index, channel) {
    //     this.files[index].online.gain[channel].gain.value = value;
    // }

    // setTempo(rate, index) {
    //     this.files[index].online.soundtouch.tempo = rate;
    // }

    // getAnalyser(index, channel) {
    //     return this.files[index].online.analyser[channel];
    // }

    newFile(fileData) {
        const tracks = this.state.tracks.slice();
        const track = <AudioTrackContainer onMounted={f => {this.trackControllers[tracks.length] = f;}} file={fileData} key={tracks.length} />;
        tracks.push(track);
        console.log("called", track)
        this.setState({
            tracks: tracks
        });
    }

    componentDidMount() {
        this.props.onMounted(this.newFile);
    }

    render() {
        return (
            <div>
                <PlayButton handler={(e) => this.togglePlay(e.target)} />
                <StopButton handler={this.stop} />
                <SlideController min={0.5} max={2} step = {0.01} handler={this.playBackHandler} text={"Playback Rate"}/>
                {this.state.tracks}
            </div>
        );
    }
}

const PlayButton = (props) => {
    return  (
        <Button
        id="audio-play-pause-button"
        className="playpause"
        data-playing="false"
        role="switch"
        aria-checked="false"
        onClick={props.handler}>
        ▶️
    </Button>
    ); 
};

const StopButton = (props) => {
    return (
        <Button
        id="audio-stop-button"
        variant="danger"
        onClick={props.handler}>
        ⏹
        </Button>
    );
};

PlayButton.propTypes = {
    handler: PropTypes.func
}

StopButton.propTypes = {
    handler: PropTypes.func
}