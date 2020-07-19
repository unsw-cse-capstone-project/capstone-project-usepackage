import React from 'react'
import Button from 'react-bootstrap/Button'
import AudioTrackController from './audioTrackController'
import Slider from '../BasicComponents/Slider.jsx'

export default class AudioTrackContainer extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            toggleName: "Start",
            controller: null,
            time: "0.00"
        }
        this.timeInteval = null;
        this.paused = true;
        // Perform setup after promise is fulfilled
        AudioTrackController.create(props.audioRecord).then(controller => {
            this.setState({
                controller: controller
            })
            return this.state
        }).then((state) => {
            state.controller.timeCb = (time) => this.setState({time: time.toString()})
        })
        this.startTime = this.startTime.bind(this)
        this.toggle = this.toggle.bind(this)
        this.gain = this.gain.bind(this)
    }

    startTime() {
        this.timeInteval = this.state.controller.time()
    }

    stopTime() {
        clearInterval(this.timeInteval)
    }

    toggle() {
        if ( this.state.controller ) {
            this.state.controller.toggle((name) => this.setState({toggleName: name}));
            this.startTime()
            this.paused = !this.paused;
        }
    }

    gain(target) {
        const normalizedVal = target.value/100;
        if ( this.state.controller ) {
            this.state.controller.gain(normalizedVal*2);
        }
    }

    render() {
        return (
            <div className="trackContainer row">
                <div className="col-12 trackTitle"><h2>Track</h2></div>
        <div className="col-12">{this.state.time}</div>
                <div className="col-6"><Button onClick={this.toggle}>{this.state.toggleName}</Button></div>
                <div className="col-6"><Slider name="Volume" controlId="gainController" changeCallBack={this.gain} /></div>
            </div>
        );
    }
}