import React from 'react'
import Button from 'react-bootstrap/Button'
import AudioTrackController from './audioTrackController'
import Slider from '../BasicComponents/Slider.jsx'
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import CutBar from '../BasicComponents/CutBar.jsx';

export default class AudioTrackContainer extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            toggleName: "Start",
            controller: null,
            cutBar: null,
            time: "0.00",
            paused: true
        }
        this.timeInterval = null;
        // Perform setup after promise is fulfilled
        this.startTime = this.startTime.bind(this)
        this.toggle = this.toggle.bind(this)
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
        this.lengthHandle = this.lengthHandle.bind(this);
        this.posHandle = this.posHandle.bind(this);
        this.updateDestination = this.updateDestination.bind(this);
        this.time = 0;
        this.slice = 0;
        this.destination = 0;
        this.virtualCuts = [0];
        this.lengthHandleFunc = null;
        this.posHandleFunc = null;
        AudioTrackController.create(props.audioRecord).then(controller => {
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
            state.controller.lengthHandle = this.lengthHandleFunc;
            state.controller.posHandle = this.posHandleFunc;
        })
        //this.duration = this.state.controller.audioRecord.audioData.length / this.state.controller.audioRecord.audioData.sampleRate;
    }

    lengthHandle(handler) {
        this.lengthHandleFunc = handler;
        if (this.state.controller)
            this.state.controller.lengthHandle = this.lengthHandleFunc;
    }

    posHandle(handler) {
        this.posHandleFunc = handler;
        if (this.state.controller)
            this.state.controller.posHandle = this.posHandleFunc;
    }

    record() {
        if ( this.state.controller )
            return this.state.controller.record()
    }

    startTime() {
        this.timeInterval = setInterval(() => this.state.controller.time(), 50)
    }

    stopTime() {
        clearInterval(this.timeInterval)
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
        }
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
        if(e.target.value <= this.virtualCuts.length) {
            this.slice = e.target.value;
        } else {
            this.slice = this.virtualCuts.length;
        }
    }

    updateTime(e) {
        this.time = e.target.value;
    }

    // Note: need to add stuff for cutbar later
    executeCut(){
        const val = this.time;
        //if (this.time >= this.duration) return false;
        const timeSample = Math.floor(parseFloat(val)*this.state.controller.audioRecord.audioData.sampleRate);
        this.state.controller.executeCut(timeSample);
 
        const time = parseFloat(val);
        console.log(time);
        for(let i = 0; i < this.virtualCuts.length; i++){
            if(this.virtualCuts[i] === time) break;
            if(this.virtualCuts[i] > time) {
                this.virtualCuts.splice(i, 0, time);
                break;
            }
            if(i === this.virtualCuts.length - 1){
                this.virtualCuts.push(time);
                break;
            }
        }
        console.log("Executing cut in audioTrackContainer");
        console.log(this.virtualCuts);
        this.setState({
            virtualCuts: this.virtualCuts,
            cutBar: <CutBar width={600} height={60} lengthHandle={this.lengthHandle} posHandle={this.posHandle} />
        })
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

    componentDidMount() {
        this.props.onMounted(this.record)
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
    
    render() {
        return (
            <div className="trackContainer row">
                <div className="col-12 trackTitle"><h2>Track</h2></div>
                <div className="col-12 timeFont">{this.state.time}</div>
                <div className="col-6"><Button onClick={this.toggle}>{this.state.toggleName}</Button></div>
                <div><Button onClick={this.undo} variant="danger"> Undo </Button>
                <Button onClick={this.redo} variant="success"> Redo </Button></div>
                <div className="col-6"><Slider name="VolumeL" controlId="gainControllerL" changeCallBack={e => this.gain(e, 0)} /></div>
                <div className="col-6"><Slider name="VolumeR" controlId="gainControllerR" changeCallBack={e => this.gain(e, 1)} /></div>
                <div className="col-6"><Slider name="Tempo" controlId="tempoController" changeCallBack={this.tempo} /></div>
                <div className="col-6"><Slider name="Pitch" controlId="pitchController" changeCallBack={this.pitch} /></div>
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
                    {this.state.cutBar}
                </div>
                <div>
                    <Displace 
                        cropButton={this.crop}
                        handleDestination={this.updateDestination}
                        handleCopy={this.copy}
                        handleMove={this.move}
                    />
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