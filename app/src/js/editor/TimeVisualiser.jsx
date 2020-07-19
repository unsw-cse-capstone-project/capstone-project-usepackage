import React from 'react';
import PropTypes from 'prop-types';

export default class TimeVisualiser extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            width: props.width,
            height: props.height,
            analyser: props.analyser
        }
        this.ref = React.createRef();
        this.draw = this.draw.bind(this);
    }

    componentDidMount() {
        const canvas = this.ref.current;
        this.canvasCtx = canvas.getContext("2d");
        const analyser = this.state.analyser;
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        this.setState({analyser: analyser});
        this.dataArray = new Uint8Array(bufferLength);
        this.canvasCtx.fillStyle = 'black';
        this.canvasCtx.strokeStyle = 'red';
        this.canvasCtx.lineWidth = 4;
        this.draw();
    }

    draw() {
        requestAnimationFrame(this.draw);

        const bufferLength = this.state.analyser.frequencyBinCount;
        this.state.analyser.getByteTimeDomainData(this.dataArray);
        this.canvasCtx.fillRect(0, 0, this.state.width, this.state.height);
        this.canvasCtx.beginPath();

        const sliceWidth = this.state.width * 1.0 / bufferLength;
        this.canvasCtx.moveTo(0, this.dataArray[0] * this.state.height / 256.0);
        for(let i = 1, x = sliceWidth; i < bufferLength; i++, x += sliceWidth){
            this.canvasCtx.strokeStyle = 'rgb(' + (this.dataArray[i] * this.state.height / 256.0 + 100) + ',50,50)'
            this.canvasCtx.lineTo(x, this.dataArray[i] * this.state.height / 256.0);
        }
        this.canvasCtx.lineTo(this.state.width, this.state.height / 2);
        this.canvasCtx.stroke();
    }

    render() {
        return (
            <div className="visualiser">
                <canvas ref={this.ref} width={this.state.width} height={this.state.height}></canvas>
            </div>
        );
    }
}

TimeVisualiser.propTypes = {
    analyser: PropTypes.object,
    width: PropTypes.number,
    height: PropTypes.number
} 