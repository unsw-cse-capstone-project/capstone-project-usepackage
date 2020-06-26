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

    render() {
        return (
            <div className="col-3">
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