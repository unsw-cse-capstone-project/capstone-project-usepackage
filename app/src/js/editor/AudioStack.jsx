import React from 'react';
import PropTypes from 'prop-types';
import WavAudioEncoder from '../lib/WavAudioEncoder.js';
import AudioTrack from './AudioTrack.jsx';
import AudioTrackContainer from './AudioTrackContainer.jsx';
import SlideController from './controller/SlideController.jsx';
import Button from 'react-bootstrap/Button';
import PromiseQueue from '../PromiseQueue.jsx'
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';

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
        this.record = this.record.bind(this);
        this.updateSeek = this.updateSeek.bind(this);
        this.doSeek = this.doSeek.bind(this);
        this.seek = 0;
        window.doRecord = this.record;
    }

    updateSeek(e) {
        this.seek = e.target.value;
    }

    doSeek() {
        this.trackControllers.forEach((track) => {
            track.playFrom(parseInt(this.seek));
        });
        const el = document.getElementById('audio-play-pause-button');
        el.dataset.playing = "true";
        el.innerText = "⏸️";
    }

    record(type, channels) {
        const queue = new PromiseQueue();
        this.trackControllers.forEach((track) => {
            queue.add((arr) => {
                return track.record().then((data) => {
                    return [...arr, data];
                });
            });
        });
        let offCon, len, rate;
        return queue.resolve([]).then((buffs) => {
            len = buffs.reduce((prev, next) => {
                return Math.max(prev, next.length);
            }, 0);
            rate = buffs.reduce((prev, next) => {
                return Math.max(prev, next.sampleRate);
            }, 0);
            offCon = new OfflineAudioContext(2, len, rate);
            buffs.forEach((buff) => {
                const node = offCon.createBufferSource();
                node.buffer = buff;
                node.connect(offCon.destination);
                node.start();
            });
            return offCon.startRendering();
        }).then((buffer) => {
            if (channels == 2)
                return buffer;
            const left = buffer.getChannelData(0);
            const right = buffer.getChannelData(1);
            const avg = left.map((val, index) => {
                return (val + right[index]) / 2;
            });
            const retBuff = offCon.createBuffer(2, buffer.length, buffer.sampleRate);
            retBuff.copyToChannel(avg, 0);
            retBuff.copyToChannel(avg, 1);
            return retBuff;
        }).then((buffer) => {
            switch (type) {
                case "MP3": {
                    const encoder = new lamejs.Mp3Encoder(2, buffer.sampleRate, 128);
                    let mp3Data = [];
                    let mp3buf;
                    const sampleBlockSize = 576;
                    function FloatArray2Int16 (floatbuffer) {
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
                    const right = FloatArray2Int16(buffer.getChannelData(1));
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
                    console.log(mp3Data);
                    return new Blob(mp3Data, {type: 'audio/mp3'});
                }
                
                case "OGG": {
                    function getBuffers(event) {
                        var buffers = [];
                        for (var ch = 0; ch < 2; ++ch)
                            buffers[ch] = event.inputBuffer.getChannelData(ch);
                        return buffers;
                    }
                    let newCon = new OfflineAudioContext(2, buffer.length, buffer.sampleRate);
                    let encoder = new window.OggVorbisEncoder(buffer.sampleRate, 2, 1);
                    let input = newCon.createBufferSource();
                    input.buffer = buffer;
                    let processor = newCon.createScriptProcessor(2048, 2, 2);
                    input.connect(processor);
                    processor.connect(newCon.destination);
                    processor.onaudioprocess = function(event) {
                        encoder.encode(getBuffers(event));
                    };
                    input.start();
                    return newCon.startRendering().then(() => {
                        return encoder.finish();
                    });
                }
    
                case "WAV": {
                    const encode = new WavAudioEncoder(buffer.sampleRate, 2);
                    encode.encode([buffer.getChannelData(0), buffer.getChannelData(1)]);
                    const blob = encode.finish();
                    console.log(blob);
                    return blob;
                }
            }
        });
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
    
    handleSeek() {
        
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
        this.props.onMounted(this.newFile, this.record);
    }

    render() {
        return (
            <div className="row stackController">
                <div className='col-4'>
                    <PlayButton handler={(e) => this.togglePlay(e.target)} />
                    <StopButton handler={this.stop} />
                </div>
                <div className="col-4"><SlideController min={0.5} max={2} step = {0.01} handler={this.playBackHandler} text={"Playback Rate"}/></div>
                <div className="col-4">
                    <InputGroup>
                        <InputGroup.Prepend>
                            <InputGroup.Text>Seek</InputGroup.Text>
                        </InputGroup.Prepend>
                        <FormControl onChange={this.updateSeek} aria-label="Seek" className="col-2"/>
                        <InputGroup.Append>
                            <Button onClick={this.doSeek} variant="outline-secondary">Enter</Button>
                        </InputGroup.Append>
                    </InputGroup>
                </div>
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