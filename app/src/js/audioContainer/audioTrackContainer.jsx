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
        this.timeInterval = null;
        this.paused = true;
        // Perform setup after promise is fulfilled
        AudioTrackController.create(props.audioRecord).then(controller => {
            this.setState({
                controller: controller
            })
            return this.state
        }).then((state) => {
            state.controller.timeCb = (time) => this.setState({time: (128*time/44100).toString()})
        })
        this.startTime = this.startTime.bind(this)
        this.toggle = this.toggle.bind(this)
        this.gain = this.gain.bind(this)
    }

    startTime() {
        this.timeInterval = setInterval(() => this.state.controller.time(), 50)
    }

    stopTime() {
        clearInterval(this.timeInterval)
    }

    toggle() {
        if ( this.state.controller ) {
            this.state.controller.toggle((name) => this.setState({toggleName: name}));
            this.paused = !this.paused;
            if ( this.paused ) this.stopTime()
            else this.startTime()
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