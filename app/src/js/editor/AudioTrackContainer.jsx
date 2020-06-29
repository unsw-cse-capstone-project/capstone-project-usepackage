import AudioTrack from './AudioTrack.jsx';
import React from 'react';
import SlideController from './controller/SlideController.jsx';
import FreqVisualiser from './FreqVisualiser.jsx';
import TimeVisualiser from './TimeVisualiser.jsx';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import FormControl from 'react-bootstrap/FormControl';

export default class AudioTrackContainer extends React.Component {

    constructor(props) {
        super(props);
        this.gainHandler = this.gainHandler.bind(this);
        this.play = this.play.bind(this);
        this.pause = this.pause.bind(this);
        this.stop = this.stop.bind(this);
        this.playback = this.playback.bind(this);
        this.pitchHandler = this.pitchHandler.bind(this);
        this.executeCut = this.executeCut.bind(this);
        this.pickSlice = this.pickSlice.bind(this);
        this.state = {
            track: null,
            visualisers: null,
            time: "0.00"
        }
        this.audioTrack = AudioTrack.create(props.file).then((track) => {
            this.setState({
                track: track
            });
        }).then(() => {
            //this.track_analyers = [this.state.track.getAnalyser(0), this.state.track.getAnalyser(1)]
            if ( this.state.track !== null)
                this.setState({
                    visualisers:
                        [
                            <div key={2} className="col-10">
                                <FreqVisualiser width={300} height={100} key={4} analyser={this.state.track.getAnalyser(0)}/>
                                <FreqVisualiser width={300} height={100} key={5} analyser={this.state.track.getAnalyser(1)}/>
                            </div>,
                            <div key={3} className="col-10">
                                <TimeVisualiser width={300} height={100} key={6} analyser={this.state.track.getAnalyser(0)}/>
                                <TimeVisualiser width={300} height={100} key={7} analyser={this.state.track.getAnalyser(1)}/> 
                            </div>
                        ]
                })
        });
    }

    play() {
        if (this.state.track)
            this.state.track.play();
    }

    pause() {
        if (this.state.track)
            this.state.track.pause();
    }

    stop() {
        if (this.state.track)
            this.state.track.stop();
    }

    playback(value) {
        if (this.state.track)
            this.state.track.playback(value);
    }

    gainHandler(target, i) {
        if (this.state.track)
            this.state.track.setGain(target.value, i);
    }

    pitchHandler(target, i) {
        if (this.state.track)
            this.state.track.setPitch(target.value, i);
    }

    executeCut() {
        const val = document.getElementById("Time").value;
        const timeSample = parseInt(val)*44100;
        console.log("Sample", timeSample);
    }

    pickSlice() {
        const val = document.getElementById("Slice").value;
        console.log("Slice number", val)
    }

    componentDidMount() {
        this.props.onMounted({
            play: this.play,
            pause: this.pause,
            stop: this.stop,
            playback: this.playback
        });
    }
    
    render() {
        return (
            <div className="row">
                <div className="col-9 sliderContainer">
                    <SlideController min={0} max={2} step={0.01} handler={(e) => this.gainHandler(e, 0)} text={"Left Volume"}/>
                    <SlideController min={0} max={2} step={0.01} handler={(e) => this.gainHandler(e, 1)} text={"Right Volume"}/>
                    <SlideController min={0.5} max={1.5} step={0.01} handler={(e) => this.pitchHandler(e, 1)} text={"Pitch"}/>
                    {/*this.state.track ? this.state.track.getTime() : "0:00"*/}
                    {this.state.visualisers}
                    <SelectTime handleTime={this.executeCut} handleSlice={this.pickSlice}/>
                </div>  
            </div>
        );
    }
}

export const SelectTime = (props) => {
    return (
        <div>
        <InputGroup>
            <InputGroup.Prepend>
                <InputGroup.Text>Cut interval</InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl id="Time" as="textarea" aria-label="Time" />
            <InputGroup.Append>
                <Button onClick={props.handleTime} variant="outline-secondary">Button</Button>
            </InputGroup.Append>
        </InputGroup>
        <InputGroup>
            <InputGroup.Prepend>
                <InputGroup.Text>Pick Slice</InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl id="Slice" as="textarea" aria-label="Slice" />
            <InputGroup.Append>
                <Button onClick={props.handleSlice} variant="outline-secondary">Button</Button>
            </InputGroup.Append>
        </InputGroup>
        </div>
    );
}