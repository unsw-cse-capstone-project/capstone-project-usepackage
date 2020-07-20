import React from 'react';
import PropTypes from 'prop-types';

export default class CutBar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            width: props.width,
            height: props.height,
            cuts: [],
            duration: 0
        }
        this.ref = React.createRef();
        this.draw = this.draw.bind(this);
        props.lengthHandle(this.drawLengths.bind(this));
        props.posHandle(this.drawMove.bind(this));
    }

    componentDidMount() {
        const canvas = this.ref.current;
        this.canvasCtx = canvas.getContext("2d");
        //???this.dataArray = new Uint8Array(bufferLength);
        this.draw();
    }

    drawLengths(lengths) {
        this.setState({
            cuts: lengths,
            duration: lengths.reduce((a, b) => (a + b.length), 0)
        });
    }

    drawMove(position) {
        this.setState({
            position: position.pos
        });
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
        let running = 0;
        for(let i = 0, x = 0; i < numCuts; i++) {
            x = running / trackLength * this.state.width;
            running += cuts[i].length;
            let nextx = running / trackLength * this.state.width;
            const barHeight = this.state.height;
            // Add variable that is dependent on cut
            (i % 2 == 0) ? this.canvasCtx.fillStyle = 'red' : this.canvasCtx.fillStyle = 'blue';
            //this.canvasCtx.fillStyle = 'rgb(' + (100 + x / this.state.width * 155) + ',50,50)';
            this.canvasCtx.fillRect(x, 0, barWidth, barHeight);
            this.canvasCtx.fillStyle = 'white';
            this.canvasCtx.font = "15px Arial";
            this.canvasCtx.fillText(i, (x + nextx) / 2, this.state.height/2);
        }
        this.canvasCtx.fillRect(this.state.position * 128 / trackLength * this.state.width, 0, barWidth, this.state.height);
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