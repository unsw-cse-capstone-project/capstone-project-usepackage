import React from 'react';
import PropTypes from 'prop-types';

export default class CutBar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            width: props.width,
            height: props.height,
            cuts: props.cuts,
            duration: props.duration
        }
        this.ref = React.createRef();
        this.draw = this.draw.bind(this);
    }

    componentDidMount() {
        const canvas = this.ref.current;
        this.canvasCtx = canvas.getContext("2d");
        //???this.dataArray = new Uint8Array(bufferLength);
        this.draw();
    }

    draw() {
        requestAnimationFrame(this.draw);
        
        let cuts = this.state.cuts;
        let numCuts = 0;
        if ( this.state.cuts != undefined ) {
            numCuts = cuts.length;
        }
        this.canvasCtx.fillStyle = 'black';
        this.canvasCtx.fillRect(0, 0, this.state.width, this.state.height);
        this.canvasCtx.beginPath();

        const barWidth = (this.state.width / 200);
        
        let trackLength = this.state.duration;
        let n = cuts.length;
        for(let i = 0, x = 0; i < numCuts; i++) {
            x = cuts[i] / trackLength * this.state.width;
            const barHeight = this.state.height;
            // Add variable that is dependent on cut
            (i % 2 == 0) ? this.canvasCtx.fillStyle = 'red' : this.canvasCtx.fillStyle = 'blue';
            //this.canvasCtx.fillStyle = 'rgb(' + (100 + x / this.state.width * 155) + ',50,50)';
            this.canvasCtx.fillRect(x, 0, barWidth, barHeight);
            this.canvasCtx.fillStyle = 'white'; 
            this.canvasCtx.fillText(i, x, this.state.height/8 + 0.75*this.state.height * i / n);
        }
    }

    render() {
        return (
            <div className="CutBar">
                <canvas ref={this.ref} width={this.state.width} height={this.state.height}></canvas>
            </div>
        );
    }
}

CutBar.propTypes = {
    cuts: PropTypes.array,
    width: PropTypes.number,
    height: PropTypes.number,
    duration: PropTypes.number
}