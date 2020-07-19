import React from 'react'
import Button from 'react-bootstrap/Button'
import AudioTrackController from './audioTrackController'
import Slider from '../BasicComponents/Slider.jsx'
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';

export default class AudioTrackContainer extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            toggleName: "Start",
            controller: null,
            time: "0.00"
        }
        this.timeInterval = null;
        this.paused = true;
        // Perform setup after promise is fulfilled
        this.startTime = this.startTime.bind(this)
        this.toggle = this.toggle.bind(this)
        this.record = this.record.bind(this)
        this.gain = this.gain.bind(this)
        this.executeCut = this.executeCut.bind(this);
        this.pickSlice = this.pickSlice.bind(this);
        this.updateSlice = this.updateSlice.bind(this);
        this.updateTime = this.updateTime.bind(this);
        this.time = 0;
        this.slice = 0;
        AudioTrackController.create(props.audioRecord).then(controller => {
            this.setState({
                controller: controller
            })
            return this.state
        }).then((state) => {
            state.controller.timeCb = (time) => this.setState({time: Number.parseFloat(128*time/44100).toFixed(3).toString()})
            state.controller.buttonNameCb = (name) => this.setState({toggleName: name})
        })
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
            this.paused = !this.paused;
            if (this.paused) {
                this.state.controller.toggle("Play");
                this.stopTime()
            }
            else { 
                this.state.controller.toggle("Pause");
                this.startTime()
            }
        }
    }

    gain(target) {
        const normalizedVal = target.value/100;
        if ( this.state.controller ) {
            this.state.controller.gain(normalizedVal*2);
        }
    }

    updateSlice(e) {
        this.slice = e.target.value;
    }

    updateTime(e) {
        this.time = e.target.value;
    }

    // Note: need to add stuff for cutbar later
    executeCut(){
        const val = this.time;
        const timeSample = Math.floor(parseFloat(val)*this.state.track.rate);
        if ( this.state.track) {
            this.state.track.cut(timeSample);
        }
    }
    
    pickSlice() {
        // const val = this.slice;
        // if ( this.state.track)
        //     this.state.track.CurrentCut = parseInt(val);
        // console.log("Slice number", this.state.track.CurrentCut);
    }

    componentDidMount() {
        this.props.onMounted(this.record)
    }
    
    render() {
        return (
            <div className="trackContainer row">
                <div className="col-12 trackTitle"><h2>Track</h2></div>
                <div className="col-12 timeFont">{this.state.time}</div>
                <div className="col-6"><Button onClick={this.toggle}>{this.state.toggleName}</Button></div>
                <div className="col-6"><Slider name="Volume" controlId="gainController" changeCallBack={this.gain} /></div>
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