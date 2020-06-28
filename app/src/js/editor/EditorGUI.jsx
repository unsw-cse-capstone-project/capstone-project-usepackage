
import React from 'react';
import PropTypes from 'prop-types';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import FormControl from 'react-bootstrap/FormControl';
import UploadHandler from './UploadHandler.jsx';
import TimeVisualiser from './TimeVisualiser.jsx';
import FreqVisualiser from './FreqVisualiser.jsx';
import SlideController from './controller/SlideController.jsx';
import {runCommand} from '../converter/converter.js'; 
import PitchShifter from '../modulator/PitchShifter';

export default class EditorGUI extends React.Component {
    constructor(props) {
        super(props);
        this.uploadHandler = new UploadHandler();
        this.state = {
            files: [],
            visualisers: []
        };
        this.uploadButtonHandler = this.uploadButtonHandler.bind(this);
        this.uploadFileHandler = this.uploadFileHandler.bind(this);
        this.gainHandler = this.gainHandler.bind(this);
        this.playBackHandler = this.playBackHandler.bind(this);
        this.playBuffer = this.playBuffer.bind(this);
        this.stopBuffer = this.stopBuffer.bind(this);
        this.testButton = this.testButton.bind(this);
        this.getData = this.getData.bind(this);
        this.pitchHandler = this.pitchHandler.bind(this);
    }

    uploadFileHandler(e) {
        this.uploadHandler.handleChange(Array.from(e.target.files)).then((result) => {
            this.setState({
                files: result,
                visualisers: result.map((e, i) => [
                        <div key={2*i} className="col-10">
                            <FreqVisualiser width={300} height={100} key={4 * i} analyser={result[i].analyser[0]}/>
                            <FreqVisualiser width={300} height={100} key={4 * i + 1} analyser={result[i].analyser[1]}/>
                        </div>,
                        <div key={2*i + 1} className="col-10">
                            <TimeVisualiser width={300} height={100} key={4 * i + 2} analyser={result[i].analyser[0]}/>
                            <TimeVisualiser width={300} height={100} key={4 * i + 3} analyser={result[i].analyser[1]}/> 
                        </div>
                    ]
                )
            });
        }).catch( err => {console.log(err);});
    }

    uploadButtonHandler() {
        const fileInput = document.getElementById("UploadButton");
        fileInput.click();
    }

    getData() {
        return this.state.files[0];
    }

    playBuffer(e) {
        const file = this.getData();
        // console.log(this.state.files[0].arrayBuffer, audioElement.duration)
        // const currtime = audioElement.currentTime;
        // if ( audioElement.src === '') {
        //     audioElement.src = this.state.files[0].URI;
        // }
        // console.log("currtime: = " + currtime + "\naudioElement.currentTime = " + audioElement.currentTime);
        // // check if context is in suspended state (autoplay policy)
        // // if (audioContext.state === 'suspended') {
        // //     audioContext.resume();
        // // }
        // // console.log(typeof this.state.editorState.URI[0]);
        // //this.visualiserFreq();

        // // play or pause track depending on state
        // if (e.target.dataset.playing === 'false') {
        //     //audioElement.currentTime = currtime;
        //     audioElement.play();
        //     e.target.dataset.playing = 'true';
        //     e.target.innerText = "⏸️";
        // } else if (e.target.dataset.playing === 'true') {
        //     //audioElement.currentTime = currtime;
        //     audioElement.pause();
        //     e.target.dataset.playing = 'false';
        //     e.target.innerText = "▶️";
        // }
        if (e.dataset.playing === 'false') {
            file.pitch.connect(file.splitter);
            file.ctx.resume().then(() => {
                e.dataset.playing = 'true';
                e.innerText = "⏸️";
            })
        } else {
            file.pitch.disconnect();
            e.dataset.playing = 'false';
            e.innerText = "▶️";
        }
    }

    stopBuffer() {
        const file = this.getData();
        file.pitch.disconnect();
        file.pitch = new PitchShifter(file.ctx, file.audioBuffer, 16384);
        file.pitch.on('play', ()=>{});
        // const audioElement = this.getData();
        // console.log('stopping: ' + audioElement.currentTime);
        // audioElement.pause();
        // audioElement.currentTime = 0;
        // const button = document.getElementById("audio-play-pause-button");
        // button.dataset.playing = 'false';
        // button.innerText = "▶️";
    }

    gainHandler(control, i) {
        const newFileState = this.state.files;
        newFileState[0].gain[i].gain.value = control.value;
        this.setState({
            files: newFileState
        });
    }
    
    playBackHandler(control) {
        const newFileState = this.state.files;
        newFileState[0].element.playbackRate = control.value;
        this.setState({
            files: newFileState
        })
    }
    
    
    // pitchHandler(control) {
    //     // const newFileState = this.state.files;
    //     // let delta = 1;
    //     // newFileState[0].bands.low.gain.value = 1 + delta*(control === 1) - delta*(control === 3);
    //     // newFileState[0].bands.med.gain.value = 1 - delta*(control !== 2);
    //     // newFileState[0].bands.high.gain.value = 1 - delta*(control === 1) + delta*(control === 3);
    //     // //console.log(newFileState[0].element.detune.value);
    //     // //newFileState[0].element.detune.value = control.value*1000
    //     // this.setState({
    //     //     files: newFileState
    //     // })
    //     const file = this.getData();
    //     file.pitch.disconnect();
    //     file.pitch.tempo = 1;
    //     file.pitch.pitch = 2;
    //     file.pitch.connect(file.splitter);
    // }
    

    testButton() {
        // implement test here using runCommand(input, output)
        const createFileObjs = this.state.files.map(i => {
            return {
                "name": i.fileName,
                "data": new Uint8Array(i.arrayBuffer)
            }
        });
        // currently returns errno 17: file exists
        runCommand(createFileObjs, "output_test_2.mp3"); // [{}, {}]
    }

    pitchHandler() {
        const file = this.getData();
        file.pitch.off('play');
        file.pitch.tempo = 1;
        file.pitch.pitch = 2;
        file.pitch.on('play', ()=>{});
        // const getFile = this.state.files[0]
        // const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        // const gainNode = audioCtx.createGain();
        // let shifter;
        // const play = function () {
        //     shifter.connect(gainNode); // connect it to a GainNode to control the volume
        //     gainNode.connect(audioCtx.destination); // attach the GainNode to the 'destination' to begin playback
        // };
        // audioCtx.decodeAudioData(getFile.arrayBuffer.slice(), (audioData) => {
        //     const shifter = new PitchShifter(audioCtx, audioData, 1024);
        //     shifter.on('play', (stuff) => {
                
        //     })
        //     shifter.tempo = 1;
        //     shifter.pitch = 2;
        // })
    }

    render() {
        return (
            <main className="col-md-9 ml-sm-auto col-lg-10 pt-3 px-4">
                <h1>{this.props.title}</h1>
                <div className="col-9">
                    <UploadForm uploadButtonHandler={this.uploadButtonHandler} uploadFileHandler={this.uploadFileHandler} />
                    <PlayButton handler={(e) => this.playBuffer(e.target)} />
                    <StopButton handler={this.stopBuffer} />
                </div>
                <div className="row">
                    <div className="col-9 sliderContainer">
                        <SlideController min={0} max={2} step={0.01} handler={(e) => this.gainHandler(e, 0)} text={"Left Volume"}/>
                        <SlideController min={0} max={2} step={0.01} handler={(e) => this.gainHandler(e, 1)} text={"Right Volume"}/>
                        <SlideController min={0.1} max={2} step = {0.01} handler = {(e) => this.playBackHandler(e)} text={"Playback Rate"}/>
                        {/* <SlideController min={1} max={3} step = {1} handler = {(e) => this.pitchHandler(e)} text={"Pitch"}/> */}
                    </div>
                </div>
                {this.state.visualisers}
                <div className="col-9">
                    <Button variant="outline-primary" onClick={this.testButton}>Test</Button>
                </div>
                <div className="col-9">
                    <Button variant="outline-primary" onClick={this.pitchHandler}>PitchTest</Button>
                </div>
            </main>
        );
    }
}

const UploadForm = (props) => {
    return (    
    <InputGroup>
        <FormControl
            className="inputStyle"
            id="UploadButton"
            onChange={props.uploadFileHandler}
            placeholder="Upload File"
            aria-label="Upload File"
            type="file"
            multiple
        />
        <Button onClick={props.uploadButtonHandler} variant="outline-secondary">Upload</Button>
    </InputGroup>
    );
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

UploadForm.propTypes = {
    uploadFileHandler: PropTypes.func,
    uploadButtonHandler: PropTypes.func
}

PlayButton.propTypes = {
    handler: PropTypes.func
}

StopButton.propTypes = {
    handler: PropTypes.func
}

EditorGUI.propTypes = {
    title: PropTypes.string
}
