import React from 'react'
import Button from 'react-bootstrap/Button'
import AudioTrackController from './audioTrackController'
import Slider from '../BasicComponents/Slider.jsx'
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
//import CutBar from '../BasicComponents/CutBar.jsx';
import CutBar from '../BasicComponents/CutBar2.jsx';
import Hotkeys from '../BasicComponents/Hotkeys.jsx';
import FreqVisualiser from '../BasicComponents/FreqVisualiser.jsx';

export default class AudioTrackContainer extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            deleteCb: props.deleteCb,
            toggleName: "Start",
            controller: null,
            time: "0.00",
            paused: true,
            analyser: null,
            visualiser: null
        }
        this.audioRecord = props.audioRecord;
        this.timeInterval = null;
        // Perform setup after promise is fulfilled
        this.startTime = this.startTime.bind(this)
        this.toggle = this.toggle.bind(this)
        this.stop = this.stop.bind(this);
        this.props.registerCB(this.toggle)
        this.record = this.record.bind(this)
        this.gain = this.gain.bind(this)
        this.tempo = this.tempo.bind(this);
        this.pitch = this.pitch.bind(this);
        this.executeCut = this.executeCut.bind(this);
        this.pickSlice = this.pickSlice.bind(this);
        this.updateSlice = this.updateSlice.bind(this);
        this.updateTime = this.updateTime.bind(this);
        this.undo = this.undo.bind(this);
        this.redo = this.redo.bind(this);
        this.copy = this.copy.bind(this);
        this.move = this.move.bind(this);
        this.crop = this.crop.bind(this);
        this.delete = this.delete.bind(this);
        this.handleSeek = this.handleSeek.bind(this);
        this.updateDestination = this.updateDestination.bind(this);
        this.time = 0;
        this.slice = 0;
        this.destination = 0;
        this.virtualCuts = [0];
        this.lengthHandler = null;
        this.posHandler = null;
        this.waveResolve = null;
        //this.duration = this.state.controller.audioRecord.audioData.length / this.state.controller.audioRecord.audioData.sampleRate;
    }

    componentDidMount() {
        this.props.onMounted(this.record)
        console.log("audioTrackContainer mounted");
        AudioTrackController.create(this.audioRecord).then(controller => {
            this.setState({
                controller: controller
            })
            return this.state
        }).then((state) => {
            state.controller.timeCb = (time) => this.setState({time: Number.parseFloat(128*time/44100).toFixed(3).toString()})
            state.controller.buttonNameCb = (name, paused) => this.setState({
                toggleName: name,
                paused: paused
            })
            if (this.lengthHandler)
                state.controller.registerLength(this.lengthHandler);
            if (this.posHandler)
                state.controller.registerPos(this.posHandler);
            this.setState({
                visualiser: <FreqVisualiser width={500} height={100} analyser={state.controller.analyser}/>
            });
            if (this.waveResolve) {
                this.waveResolve(state.controller.waveform);
                this.waveResolve = null;
            }
        })
    }

    registerLengthHandler(handler) {
        if (this.state.controller)
            this.state.controller.registerLength(handler);
        else
            this.lengthHandler = handler;
    }

    registerPosHandler(handler) {
        if (this.state.controller)
            this.state.controller.registerPos(handler);
        else
            this.posHandler = handler;
    }

    record(type) {
        if ( this.state.controller ) {
            return ({
                rec: this.state.controller.record(type),
                stack: this.state.controller.getStack()
            })
            // return this.state.controller.record()
        }
    }

    delete() {
        console.log("Deleting object")
    }

    startTime() {
        this.timeInterval = setInterval(() => this.state.controller.time(), 50)
    }

    stopTime() {
        clearInterval(this.timeInterval)
    }
    
    stop() {
        if(this.state.controller && !this.state.paused){
            this.toggle();
        }
        const timeStore = this.seekT ? this.seekT : 0;
        this.seekT = 0;
        this.handleSeekT();
        this.seekT = timeStore;
        this.stopTime();
    }

    toggle() {
        if ( this.state.controller ) {
            if (!this.state.paused) {
                this.state.controller.toggle("Play", true);
                this.stopTime()
            }
            else { 
                this.state.controller.toggle("Pause", false);
                this.startTime()
            }
        } else console.log("No controller connected!");
    }

    gain(target, channel) {
        const normalizedVal = target.value/100;
        if ( this.state.controller ) {
            this.state.controller.gain(normalizedVal*2, channel, this.slice);
        }
    }
    
    tempo(target) {
        const normalisedVal = 0.5 + 3 * target.value / 200;
        if(this.state.controller) {
            console.log("Changing tempo");
            this.state.controller.tempo(normalisedVal, this.slice);
        }
    }
    
    pitch(target) {
        const normalisedVal = 0.5 + 3 * target.value / 200;
        if(this.state.controller) {
            this.state.controller.pitch(normalisedVal, this.slice);
        }
    }

    updateSlice(e) {
        this.slice = e.target.value;
        // if(e.target.value <= this.virtualCuts.length) {
        //     this.slice = e.target.value;
        // } else {
        //     this.slice = this.virtualCuts.length;
        // }
    }

    updateTime(e) {
        this.time = e.target.value;
    }

    // Note: need to add stuff for cutbar later
    executeCut(samples=null){
        let time, timeSample;
        const sampleRate = this.state.controller.audioRecord.audioData.sampleRate;
        if (samples) {
            timeSample = Math.floor(samples);
            time = samples / sampleRate;
        } else {
            time = parseFloat(this.time);
            timeSample = Math.floor(time * sampleRate);
        }
        console.log("samplesrate: ", sampleRate);
        console.log("samples: ", samples);
        console.log("timesamples: ", timeSample);
        this.state.controller.executeCut(timeSample);
        console.log(time);
        // for(let i = 0; i < this.virtualCuts.length; i++){
        //     if(this.virtualCuts[i] === time) break;
        //     if(this.virtualCuts[i] > time) {
        //         this.virtualCuts.splice(i, 0, time);
        //         break;
        //     }
        //     if(i === this.virtualCuts.length - 1){
        //         this.virtualCuts.push(time);
        //         break;
        //     }
        // }
        // console.log("Executing cut in audioTrackContainer");
        // console.log(this.virtualCuts);
        // this.setState({
        //     virtualCuts: this.virtualCuts
        // })
    }
    
    pickSlice() {
        // I don't think we need this function.
        // Need to change the form control.
        // const val = this.slice;
        // if ( this.state.track)
        //     this.state.track.CurrentCut = parseInt(val);
        // console.log("Slice number", this.state.track.CurrentCut);
    }
    
    undo(){
        // NOTE: Undo needs a way of reverting the virtualCuts array
        if(this.state.controller) this.state.controller.undo();
    }
    
    redo(){
        if(this.state.controller) this.state.controller.redo();
    }
    
    crop(){
        if (this.state.controller) this.state.controller.crop(this.destination);
    }
    
    copy(){
        if (this.state.controller) this.state.controller.copy(this.slice, this.destination);
    }
    
    move(){
        if (this.state.controller) this.state.controller.move(this.slice, this.destination);
    }
    
    updateDestination(e){
        this.destination = e.target.value;
    }

    updateSeekS(e) {
        this.seekS = e.target.value;
    }

    updateSeekT(e) {
        this.seekT = e.target.value;
    }

    handleSeek(slice, time) {
        console.log("Slice in container");
        this.state.controller.seek(slice, time);
        console.log(this.state.controller.seek);
        console.log(this.state.controller);
    }

    handleSeekS() {
        this.handleSeek(parseInt(this.seekS), 0);
    }

    handleSeekT() {
        const time = parseFloat(this.seekT);
        let i = 0;
        for (; i + 1 < this.virtualCuts.length && this.virtualCuts[i + 1] < time; i++);
        this.handleSeek(i, Math.round(this.state.controller.audioRecord.audioData.sampleRate * (time - this.virtualCuts[i])));
    }

    getWave() {
        return new Promise((resolve) => {
            if (this.controller)
                return this.controller.waveform;
            this.waveResolve = resolve;
        });
    }
    
    render() {
        return (
            <div className="trackContainer row">
                <div className="col-12 trackTitle"><h2>Track</h2></div>
                <div className="col-12 timeFont">{this.state.time}</div>
                <div className="col-4"><Button onClick={this.toggle}>{this.state.toggleName}</Button>
                <Button onClick={this.stop} variant="danger">Stop</Button>
                </div>
                <div className="col-4">
                    <Button onClick={this.undo} variant="danger"> Undo </Button>
                    <Button onClick={this.redo} variant="success"> Redo </Button>
                </div>
                <div className="col-4">
                    <Button onClick={() => this.state.deleteCb(this.props.audioRecord.fileURL)} variant="danger"> Delete </Button>
                </div>
                <div className="col-6"><Slider name="VolumeL" controlId="gainControllerL" changeCallBack={e => this.gain(e, 0)} /></div>
                <div className="col-6"><Slider name="VolumeR" controlId="gainControllerR" changeCallBack={e => this.gain(e, 1)} /></div>
                <div className="col-6"><Slider name="Tempo" controlId="tempoController" changeCallBack={this.tempo} /></div>
                <div className="col-6"><Slider name="Pitch" controlId="pitchController" changeCallBack={this.pitch} /></div>
                <div><Hotkeys undoHandler={this.undo} redohandler={this.redo}/></div>
                <div className="col-6">
                    <SelectTime 
                        handleTime={this.executeCut} 
                        handleSlice={this.pickSlice}
                        updateTime={this.updateTime}
                        updateSlice={this.updateSlice}
                        formatHandler={(e) => this.formatHandler(e.target)}
                        downloadHandler={this.downloadHandler}
                    />
                    <ol>
                        {this.virtualCuts.map((cut, index) => (
                            <li key = {index}>{cut}</li>
                        ))}
                    </ol>
                </div>
                <div>
                    <Displace 
                        cropButton={this.crop}
                        handleDestination={this.updateDestination}
                        handleCopy={this.copy}
                        handleMove={this.move}
                    />
                </div>
                <div className="col-12">
                    <SelectSeek 
                        handleSeekS={this.handleSeekS.bind(this)} 
                        handleSeekT={this.handleSeekT.bind(this)}
                        updateSeekS={this.updateSeekS.bind(this)}
                        updateSeekT={this.updateSeekT.bind(this)}
                    />
                </div>
                <div className="col-12">
                    <CutBar
                        cutCB={this.executeCut}
                        width={600}
                        height={60}
                        regLen={this.registerLengthHandler.bind(this)}
                        regPos={this.registerPosHandler.bind(this)}
                        getWave={this.getWave.bind(this)}
                    />
                </div>
                <div className="col-12">
                {this.state.visualiser}
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
                        <InputGroup.Text>Current Slice</InputGroup.Text>
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

export const SelectSeek = (props) => {
    return (
        <div className="row">
            <div className="col-6">
                <InputGroup>
                    <InputGroup.Prepend>
                        <InputGroup.Text>Seek Time</InputGroup.Text>
                    </InputGroup.Prepend>
                    <FormControl onChange={props.updateSeekT} aria-label="Seek Time" className="col-2"/>
                    <InputGroup.Append>
                        <Button onClick={props.handleSeekT} variant="outline-secondary">Enter</Button>
                    </InputGroup.Append>
                </InputGroup>
            </div>
            <div className="col-6">
                <InputGroup>
                    <InputGroup.Prepend>
                        <InputGroup.Text>Seek Slice</InputGroup.Text>
                    </InputGroup.Prepend>
                    <FormControl onChange={props.updateSeekS} aria-label="Seek Slice" className="col-2"/>
                    <InputGroup.Append>
                        <Button onClick={props.handleSeekS} variant="outline-secondary">Enter</Button>
                    </InputGroup.Append>
                </InputGroup>
            </div>
        </div>
    );
}

export const Displace = (props) => {
    return (
        <div className="row">
            <div className="col-12">
                <InputGroup>
                    <InputGroup.Prepend>
                        <InputGroup.Text>Destination Cut</InputGroup.Text>
                    </InputGroup.Prepend>
                        <FormControl onChange={props.handleDestination} aria-label="dest" className="col-2"/>
                    <InputGroup.Append>
                        <Button onClick={props.handleCopy}>Copy</Button>
                        <Button onClick={props.handleMove}>Move</Button>
                        <Button onClick={props.cropButton} variant="dark">Crop</Button>
                    </InputGroup.Append>
                </InputGroup>
            </div>
        </div>
    )
}