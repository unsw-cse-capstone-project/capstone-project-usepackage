import AudioTrack from './AudioTrack.jsx';
import React from 'react';
import SlideController from './controller/SlideController.jsx';
import FreqVisualiser from './FreqVisualiser.jsx';
import TimeVisualiser from './TimeVisualiser.jsx';
import CutBar from './CutBar.jsx';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import FormControl from 'react-bootstrap/FormControl';
import Form from 'react-bootstrap/Form';
import Dropdown from 'react-bootstrap/Dropdown';
import Col from 'react-bootstrap/Col';

//import minsSecs, { diffSecs } from '../soundtouch/minsSecs';

export default class AudioTrackContainer extends React.Component {

    constructor(props) {
        super(props);
        this.gainHandler = this.gainHandler.bind(this);
        this.play = this.play.bind(this);
        this.playFrom = this.playFrom.bind(this);
        this.pause = this.pause.bind(this);
        this.stop = this.stop.bind(this);
        this.playback = this.playback.bind(this);
        this.pitchHandler = this.pitchHandler.bind(this);
        this.executeCut = this.executeCut.bind(this);
        this.pickSlice = this.pickSlice.bind(this);
        this.cropHandler = this.cropHandler.bind(this);
        this.updateSlice = this.updateSlice.bind(this);
        this.updateTime = this.updateTime.bind(this);
        this.setAnalyserCallback = this.setAnalyserCallback.bind(this);
        //this.setCutBarCallback = this.setCutBarCallback.bind(this);
        this.record = this.record.bind(this);
        this.slice = 0;
        this.time = 0;
        this.state = {
            track: null,
            visualisers: null,
            analyser: [null, null],
            cutBar: null,
            time: "0.00"
        }
        this.audioTrack = AudioTrack.create(props.file).then((track) => {
            this.setState({
                track: track
            });
        }).then(() => {
            this.setAnalyserCallback((analysers) => {
                this.setState({
                    analyser: analysers.map((analyser) => {
                        analyser.fftSize = 256;
                        return analyser;
                    })
                });
                this.setState({
                    visualisers:
                        [
                            <div key={2} className="col-10">
                                <div className="row">
                                <div className="col">
                                <FreqVisualiser width={300} height={100} key={4} analyser={this.state.analyser[0]}/>
                                </div>
                                <div className="col">
                                <FreqVisualiser width={300} height={100} key={5} analyser={this.state.analyser[1]}/>
                                </div>
                                </div>
                            </div>,
                            <div key={3} className="col-10">
                                <div className="row">
                                <div className="col">
                                <TimeVisualiser width={300} height={100} key={6} analyser={this.state.analyser[0]}/>
                                </div>
                                <div className="col">
                                <TimeVisualiser width={300} height={100} key={7} analyser={this.state.analyser[1]}/> 
                                </div>
                                </div>
                            </div>
                        ]
                })
            });
            this.setState({
                analyser: [this.state.track.getAnalyser(0), this.state.track.getAnalyser(1)]
            })
            if ( this.state.track !== null)
                this.setState({
                    visualisers:
                        [
                            <div key={2} className="col-10">
                                <div className="row">
                                <div className="col">
                                <FreqVisualiser width={300} height={100} key={4} analyser={this.state.analyser[0]}/>
                                </div>
                                <div className="col">
                                <FreqVisualiser width={300} height={100} key={5} analyser={this.state.analyser[1]}/>
                                </div>
                                </div>
                            </div>,
                            <div key={3} className="col-10">
                                <div className="row">
                                <div className="col">
                                <TimeVisualiser width={300} height={100} key={6} analyser={this.state.analyser[0]}/>
                                </div>
                                <div className="col">
                                <TimeVisualiser width={300} height={100} key={7} analyser={this.state.analyser[1]}/> 
                                </div>
                                </div>
                            </div>
                        ]
                })
        });
    }

    setAnalyserCallback(cb) {
        if (this.state.track)
            this.state.track.setAnalyserCallback(cb);
    }
    
    playFrom(time) {
        if (this.state.track)
            this.state.track.playFrom(time);
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

    record() {
        if (this.state.track)
            return this.state.track.record();
    }

    pitchHandler(target, i) {
        if (this.state.track)
            this.state.track.setPitch(target.value, i);
    }

    updateSlice(e) {
        this.slice = e.target.value;
    }

    updateTime(e) {
        this.time = e.target.value;
    }

    executeCut() {
        const val = this.time;
        const timeSample = Math.floor(parseFloat(val)*this.state.track.rate);
        if ( this.state.track) {
            this.state.track.cut(timeSample);
            this.setState({
                track: this.state.track,
                cutBar: <CutBar width={600} height={60} cuts={this.state.track.cuts} />
            });
        }
    }

    pickSlice() {
        const val = this.slice;
        if ( this.state.track)
            this.state.track.CurrentCut = parseInt(val);
        console.log("Slice number", this.state.track.CurrentCut);
    }

    // Crops/uncrops the currently selected slice
    // Does not work properly
    cropHandler(){
        let index = this.state.track.CurrentCut;
        const cuts = this.state.track.cuts.length;
        const len = this.state.track.cuts[index].length;
        console.log(index);
        if(this.state.track.cuts[index].cropped == undefined || this.state.track.cuts[index].cropped == false) {
            //console.log("ERROR! .cropped bool not set in cut number: ", index);
            this.state.track.cuts[index].cropped = true;
            // Decrement the time values for the following cuts
            // for(let incr = index + 1; incr < cuts; incr++) {
            //     console.log(incr);
            //     this.state.track.cuts[incr].time -= len;
            // }
            console.log("Cropping out section: ", index);
        } else {
            this.state.track.cuts[index].cropped = false;
            // Increment the time values for the following cuts
            // for(let incr = index + 1; incr < cuts; incr++) {
            //     this.state.track.cuts[incr].time += len;
            // }
            console.log("Uncropping section: ", index);
        }
        
    }

    componentDidMount() {
        this.props.onMounted({
            play: this.play,
            playFrom: this.playFrom,
            pause: this.pause,
            stop: this.stop,
            playback: this.playback,
            record: this.record
        });
    }

    render() {
        return (
            <div className="row trackContainer">
                <div className="col-6">
                    <SlideController min={0} max={2} step={0.01} handler={(e) => this.gainHandler(e, 0)} text={"Left Volume"}/>
                    <SlideController min={0} max={2} step={0.01} handler={(e) => this.gainHandler(e, 1)} text={"Right Volume"}/>
                    <SlideController min={0.5} max={1.5} step={0.01} handler={(e) => this.pitchHandler(e, 1)} text={"Pitch"}/>
                    <Button onClick={this.cropHandler} id="cropButton">Crop</Button>
                    <p>Cuts in samples:</p>
                    <ol>
                        {this.state.track ? this.state.track.cuts.map((cut, index) => (
                            <li key = {index}>{cut.time}</li>
                        )): "No cuts"}
                    </ol>
                    {this.state.track && this.state.track.cuts ? this.state.cutBar : "TESTING"}
                </div>
                <div className="col-6">
                    <SelectTime 
                        handleTime={this.executeCut} 
                        handleSlice={this.pickSlice}
                        updateTime={this.updateTime}
                        updateSlice={this.updateSlice}
                        formatHandler={(e) => this.formatHandler(e.target)}
                        downloadHandler={this.downloadHandler}
                    />
                </div>
                <div className="col-12">
                    {this.state.visualisers}
                </div>
            </div>  
        );
    }
}

export const SelectTime = (props) => {
    return (
        <div className="row">
            <div className="col-6">
                <InputGroup>
                    <InputGroup.Prepend>
                        <InputGroup.Text>Cut interval</InputGroup.Text>
                    </InputGroup.Prepend>
                    <FormControl onChange={props.updateTime} aria-label="Time" className="col-2"/>
                    <InputGroup.Append>
                        <Button onClick={props.handleTime} variant="outline-secondary">Enter</Button>
                    </InputGroup.Append>
                </InputGroup>
            </div>
            <div className="col-6">
                <InputGroup>
                    <InputGroup.Prepend>
                        <InputGroup.Text>Pick Slice</InputGroup.Text>
                    </InputGroup.Prepend>
                    <FormControl onChange={props.updateSlice} aria-label="Slice" className="col-2"/>
                    <InputGroup.Append>
                        <Button onClick={props.handleSlice} variant="outline-secondary">Enter</Button>
                    </InputGroup.Append>
                </InputGroup>
            </div>
        </div>
    );
}