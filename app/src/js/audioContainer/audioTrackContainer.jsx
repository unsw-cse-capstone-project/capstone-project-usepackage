import React from 'react'
import Button from 'react-bootstrap/Button'
import AudioTrackController from './audioTrackController'
import Slider from '../BasicComponents/Slider.jsx'
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
//import CutBar from '../BasicComponents/CutBar.jsx';
import CutBar from '../BasicComponents/CutBar.jsx';
import FreqVisualiser from '../BasicComponents/FreqVisualiser.jsx';
import { BsXCircleFill, BsFillPlayFill, BsFillPauseFill, BsFillStopFill } from "react-icons/bs"
import { MdUndo, MdRedo } from "react-icons/md";

export default class AudioTrackContainer extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            deleteCb: props.deleteCb,
            toggleName: "Play",
            controller: null,
            time: "0.00",
            paused: true,
            analyser: null,
            visualiser: null,
            sampleRate: 1
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
        this.updateSlice = this.updateSlice.bind(this);
        this.updateTime = this.updateTime.bind(this);
        this.undo = this.undo.bind(this);
        this.redo = this.redo.bind(this);
        this.props.undoCB(this.undo);
        this.props.redoCB(this.redo);
        this.copy = this.copy.bind(this);
        this.crop = this.crop.bind(this);
        this.delete = this.delete.bind(this);
        this.regUpdate = this.regUpdate.bind(this);
        this.time = 0;
        this.slice = 0;
        this.lengthHandler = null;
        this.posHandler = null;
        this.sampleHandler = null;
        this.regUpdates = [];
        this.waveResolve = null;
        this.transmitAction = this.props.transmitAction;
        this.key = props.skey;
        //this.duration = this.state.controller.audioRecord.audioData.length / this.state.controller.audioRecord.audioData.sampleRate;
    }

    componentDidMount() {
        this.props.onMounted(this.record)
        console.log("audioTrackContainer mounted");
        AudioTrackController.create(this.audioRecord, this.props.stack).then(controller => {
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
            if (this.sampleHandler)
                state.controller.registerSample(this.sampleHandler);
            if (this.lengthHandler)
                state.controller.registerLength(this.lengthHandler);
            if (this.posHandler)
                state.controller.registerPos(this.posHandler);
            if (this.regUpdates.length)
                this.regUpdates.forEach(v => {
                    state.controller.regUpdate(v[0], v[1]);
                });
            this.setState({
                visualiser: <FreqVisualiser width={400} height={100} analyser={state.controller.analyser}/>
            });
            if (this.waveResolve) {
                this.waveResolve(state.controller.waveform);
                this.waveResolve = null;
            }
        })
    }

    // These register handlers are for updating the CutBar when changes are made to cuts
    registerLengthHandler(handler) {
        const func = (data) => {
            if (!this.state.paused)
                this.toggle();
            handler(data);
        };
        if (this.state.controller)
            this.state.controller.registerLength(func);
        else
            this.lengthHandler = func;
    }

    registerPosHandler(handler) {
        if (this.state.controller)
            this.state.controller.registerPos(handler);
        else
            this.posHandler = handler;
    }

    registerSampleHandler(handler) {
        if (this.state.controller)
            this.state.controller.registerSample(handler);
        else
            this.sampleHandler = handler;
    }

    regUpdate(type, f) {
        if (this.state.controller)
            this.state.controller.regUpdate(type, f);
        else
            this.regUpdates.push([type, f]);
    }

    cutbarMoveCut(index, time) {
        this.state.controller.moveCut(index, time);
    }

    cutbarMove(from, to) {
        this.state.controller.move(from, to);
    }

    cutbarSeek(index, offset = 0) {
        this.state.controller.seek(index, offset);
    }

    cutbarSelect(index) {
        this.slice = index;
        this.state.controller.updateSliders(index);
    }

    record(type) {
        if ( this.state.controller ) {
            return ({
                rec: this.state.controller.record(type),
                stack: this.state.controller.getStack()
            })
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
        this.cutbarSeek.bind(this)(0, 0);
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
        this.transmitAction(this.key);
    }
    
    tempo(target) {
        const normalisedVal = 0.5 + 3 * target.value / 200;
        if(this.state.controller) {
            console.log("Changing tempo");
            this.state.controller.tempo(normalisedVal, this.slice);
        }
        this.transmitAction(this.key);
    }
    
    pitch(target) {
        const normalisedVal = 0.5 + 3 * target.value / 200;
        if(this.state.controller) {
            this.state.controller.pitch(normalisedVal, this.slice);
        }
        this.transmitAction(this.key);
    }

    updateSlice(e) {
        this.slice = e.target.value;
    }

    updateTime(e) {
        this.time = e.target.value;
    }

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
        this.state.controller.executeCut(timeSample);
        this.transmitAction(this.key);
    }
    
    undo(){
        if(this.state.controller) this.state.controller.undo();
    }
    
    redo(){
        if(this.state.controller) this.state.controller.redo();
    }
    
    crop(){
        if (this.state.controller) {
            this.state.controller.crop(this.slice);
            this.transmitAction(this.key);
        }
    }
    
    copy(){
        if (this.state.controller) {
            this.state.controller.copy(this.slice, this.slice);
            this.transmitAction(this.key);
        }
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
                <div className="col-11 trackTitle"><h2>Track</h2></div>
                <div className="col-1 text-right">
                    <Button onClick={() => this.state.deleteCb(this.props.audioRecord.fileURL)} variant="danger"><BsXCircleFill /></Button>
                </div>
                <div className="col-4">
                    <CutBar
                        cutCB={this.executeCut}
                        editCB={this.cutbarMoveCut.bind(this)}
                        moveCB={this.cutbarMove.bind(this)}
                        seekCB={this.cutbarSeek.bind(this)}
                        selectCB={this.cutbarSelect.bind(this)}
                        width={600}
                        height={60}
                        regSample={this.registerSampleHandler.bind(this)}
                        regLen={this.registerLengthHandler.bind(this)}
                        regPos={this.registerPosHandler.bind(this)}
                        getWave={this.getWave.bind(this)}
                    />
                    <div>{this.state.time}</div>
                </div>
                <div className="col-1"><Slider regUpdate={f => this.regUpdate('gainL', f)} name="VL" controlId="gainControllerL" changeCallBack={e => this.gain(e, 0)} /></div>
                <div className="col-1"><Slider regUpdate={f => this.regUpdate('gainR', f)} name="VR" controlId="gainControllerR" changeCallBack={e => this.gain(e, 1)} /></div>
                <div className="col-1"><Slider regUpdate={f => this.regUpdate('tempo', f)} name="Tm" controlId="tempoController" changeCallBack={this.tempo} /></div>
                <div className="col-1"><Slider regUpdate={f => this.regUpdate('pitch', f)} name="Pt" controlId="pitchController" changeCallBack={this.pitch} /></div>
                {/* add visualisers later */}
                {/* <div className="col-12">
                
                </div> */}
                
                <div className="col-4">
                {this.state.visualiser}
                </div>
                
                <div>
                    <Displace 
                        cropButton={this.crop}
                        handleDestination={this.updateDestination}
                        handleCopy={this.copy}
                        handleMove={this.move}
                    />
                </div>
                <div>
                    <Button className="btn-margin" onClick={this.toggle}>{this.state.toggleName === "Play" ? <BsFillPlayFill /> : <BsFillPauseFill />}</Button>
                    <Button className="btn-margin" onClick={this.stop} variant="danger"><BsFillStopFill /></Button>
                </div>
            </div>
        );
    }
}

export const Displace = (props) => {
    return (
        <div className="row">
            <div className="col-12">
                <InputGroup>
                    <Button onClick={props.handleCopy}>Copy</Button>
                    <Button onClick={props.cropButton} variant="dark">Crop</Button>
                </InputGroup>
            </div>
        </div>
    )
}