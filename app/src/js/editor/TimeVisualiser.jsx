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
    
    draw() {
        requestAnimationFrame(this.draw);

        const bufferLength = this.state.analyser.frequencyBinCount;
        this.state.analyser.getByteTimeDomainData(this.dataArray);
        this.canvasCtx.fillRect(0, 0, this.state.width, this.state.height);
        this.canvasCtx.beginPath();
        
        const sliceWidth = this.state.width * 1.0 / bufferLength;
        this.canvasCtx.moveTo(0, this.dataArray[0] * this.state.height / 256.0);
        for(let i = 1, x = sliceWidth; i < bufferLength; i++, x += sliceWidth)
            this.canvasCtx.lineTo(x, this.dataArray[i] * this.state.height / 256.0);

        this.canvasCtx.lineTo(this.state.width, this.state.height / 2);
        this.canvasCtx.stroke();
    }
    
}

TimeVisualiser.propTypes = {
    analyser: PropTypes.object,
    width: PropTypes.number,
    height: PropTypes.number
}