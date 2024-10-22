import React from 'react';
import PropTypes from 'prop-types';

export default class FreqVisualiser extends React.Component {
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
        this.draw();
    }

    draw() {
        requestAnimationFrame(this.draw);

        const bufferLength = this.state.analyser.frequencyBinCount;
        this.state.analyser.getByteTimeDomainData(this.dataArray);
        this.canvasCtx.fillStyle = 'white';
        this.canvasCtx.fillRect(0, 0, this.state.width, this.state.height);
        this.canvasCtx.beginPath();

        const barWidth = (this.state.width / bufferLength) * 2.5;

        // Draws multiple vertical bars along the x axis, with their height dependent on the volume of the audio at that frequency.
        for(let i = 0, x = 0; i < bufferLength; i++, x += barWidth + 1) {
            const barHeight = this.dataArray[i] / 2;
            this.canvasCtx.fillStyle = 'rgb('
                + (barHeight + 130*x/this.state.width) + ','
                + (barHeight - 50) + ','
                + (barHeight + 130 - 130*x/this.state.width) + ')';
            this.canvasCtx.fillRect(x, this.state.height - barHeight / 2, barWidth, barHeight);
        }
    }

    render() {
        return (
            <div className="visualiser">
                <canvas ref={this.ref} width={this.state.width} height={this.state.height}></canvas>
            </div>
        );
    }
}

FreqVisualiser.propTypes = {
    analyser: PropTypes.object,
    width: PropTypes.number,
    height: PropTypes.number
} 