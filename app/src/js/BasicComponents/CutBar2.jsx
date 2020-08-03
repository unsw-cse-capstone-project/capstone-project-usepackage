import React from 'react';
import PropTypes from 'prop-types';
import CutElement from './CutElement.jsx';

export default class CutBar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            width: props.width,
            height: props.height,
            cuts: [{
                sourceStart: 0,
                sourceEnd: 1,
                gain: [1, 1]
            }],
            lengths: [{
                length: 1,
                cropped: false
            }],
            sampleRate: 1,
            duration: 1,
            cropped: [],
            duration: 1,
            position: 0,
            length: 1,
            markers: [],
            markerID: 0
        };
        this.updates = [];
        this.interact = {
            init: 0,
            initVal: 0,
            final: 0,
            move: false,
            started: false,
            storedsum: 0,
            index: 0
        };
        this.waveform = null;
        this.cutCB = props.cutCB;
        this.editCB = props.editCB;
        this.moveCB = props.moveCB;
        this.seekCB = props.seekCB;
        this.ref = React.createRef();
        this.bgref = React.createRef();
        this.draw = this.draw.bind(this);
        this.drawbg = this.drawbg.bind(this);
        this.seekTo = this.seekTo.bind(this);
        this.updateMarkers = this.updateMarkers.bind(this);
        props.regSample(this.setSample.bind(this));
        props.regLen(this.drawLengths.bind(this));
        props.regPos(this.drawMove.bind(this));
        props.getWave().then((waveform) => {
            this.waveform = waveform;
            this.drawbg();
        });
    }

    componentDidMount() {
        const canvas = this.ref.current;
        this.canvasCtx2 = this.bgref.current.getContext('2d');

        canvas.addEventListener('mousedown', (e) => {
            let cumsum = this.state.lengths[0].length;
            const goal = e.offsetX / this.state.width * this.state.length;
            for (let i = 0; i < this.state.lengths.length;) {
                if (goal < cumsum) {
                    this.interact.init = i;
                    this.interact.storedsum = cumsum;
                    break;
                }
                if (i + 1 < this.state.lengths.length)
                    cumsum += this.state.lengths[++i].length;
            }
            this.interact.initVal = e.offsetX;
            this.interact.started = true;
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (this.interact.started) {
                this.interact.move = true;
                let cumsum = this.state.lengths[0].length;
                const goal = e.offsetX / this.state.width * this.state.length;
                for (let i = 0; i < this.state.lengths.length;) {
                    if (goal < cumsum) {
                        this.interact.final = i;
                        break;
                    }
                    if (i + 1 < this.state.lengths.length)
                        cumsum += this.state.lengths[++i].length;
                }
            }
            console.log(this.interact);
        });
        
        canvas.addEventListener('mouseup', (e) => {
            if (!this.interact.move && this.interact.started) {
                if (this.interact.index != this.interact.init) {
                    this.interact.index = this.interact.init;
                    console.log("SEEK", this.interact.index);
                    this.seekTo(this.interact.index);
                } else {
                    console.log("CUT", e.offsetX / this.state.width * this.state.length);
                    this.cutCB(e.offsetX / this.state.width * this.state.length);
                }
            } else if (this.interact.init != this.interact.final && this.interact.started) {
                const lengthCopy = this.state.lengths.map((a) => a.length);
                const temp = lengthCopy.splice(this.interact.init, 1);
                if (this.interact.init > this.interact.final)
                    this.interact.index = this.interact.final;
                else
                    this.interact.index = this.interact.final - 1;
                lengthCopy.splice(this.interact.index, 0, ...temp);
                let cumsum = 0;
                for (let i = 0; i < this.interact.index; i++)
                    cumsum += lengthCopy[i];
                console.log("MOVE", this.interact.init, this.interact.final);
                this.moveCB(this.interact.init, this.interact.final);
                this.seekTo(this.interact.final, cumsum / this.state.length);
            }
            this.interact.move = false;
            this.interact.started = false;
        })
        this.canvasCtx = canvas.getContext("2d");
        this.draw();
    }

    seekTo(cumsum) {
        // TODO: Seek marker
        this.seekCB(cumsum / this.state.length * this.state.duration);
    }

    setSample(sampleRate) {
        this.setState({
            sampleRate: sampleRate
        });
    }

    updateMarkers() {
        console.log("UPDATING WITH");
        console.log(this.state.cuts);
        console.log(this.state.markers);
        const newMarkers = this.state.cuts.length - 1;
        const readjust = Math.min(newMarkers, this.state.markers.length)
        // Readjust all
        let left = 0;
        let right = 0;
        for (let i = 0; i < readjust; i++) {
            if (this.state.lengths.length > i + 1)
                right = (left + this.state.lengths[i].length + this.state.lengths[i + 1].length);
            else 
                right = this.state.length;
            console.log("UPDATED", i, left / this.state.sampleRate, right / this.state.sampleRate);
            this.updates[i].update({
                duration: this.state.duration,
                left: left / this.state.sampleRate,
                right: right / this.state.sampleRate,
                offset: (left + this.state.lengths[i].length) * this.state.width / this.state.length,
                time: (left + this.state.lengths[i].length) / this.state.sampleRate,
                index: i
            });
            left += this.state.lengths[i].length;
        }
        if (newMarkers > this.state.markers.length) {
            const timeVal = left + this.state.lengths[readjust].length;
            this.setState({
                markers: [...this.state.markers,
                <CutElement
                    key={this.state.markerID}
                    index={this.state.markers.length}
                    width={this.state.width}
                    duration={this.state.duration}
                    left={left / this.state.sampleRate}
                    right={this.state.duration}
                    time={timeVal / this.state.sampleRate}
                    openCB={(index) => {
                        this.updates.forEach((v, i) => {
                            if (i != index)
                                v.close();
                        });
                    }}
                    editCB={(i, v) => {
                        console.log(v, "FROM", i);
                        let cumsum = 0;
                        const samples = v * this.state.sampleRate;
                        for (let j = 0; j < i + 1; j++)
                            cumsum += this.state.lengths[j].length;
                        console.log("SAMPLE CUT", samples - cumsum);
                        this.editCB(i, samples - cumsum);
                    }}
                    regUpdate={(i, u, o, c) => {
                        this.updates[i] = {
                            update: u,
                            offset: o,
                            close: c
                        };
                    }}
                />],
                markerID: this.state.markerID + 1
            });
        } else if (newMarkers < this.state.markers.length) {
            this.setState({
                markers: this.state.markers.slice(0, newMarkers)
            });
            this.updates.slice(0, newMarkers);
        }
    }

    drawLengths(data) {
        const length = data.lengths.reduce((a, b) => (a + b.length), 0);
        this.setState({
            cuts: data.cuts,
            lengths: data.lengths,
            cropped: data.lengths.filter(v => v.cropped),
            length: length,
            duration: length / this.state.sampleRate
        });
        this.updateMarkers();
        this.draw();
    }

    drawMove(position) {
        this.setState({
            position: position.time
        });
        this.draw(true);
    }

    drawbg() {
        if (this.waveform) {
            const form = [
                this.waveform.getChannelData(0),
                this.waveform.getChannelData(this.waveform.numberOfChannels < 2 ? 0 : 1)
            ];
            this.bgref.current.width = this.state.width;
            this.canvasCtx2.strokeStyle = 'black';
            let canvasStart = 0;
            for (let i = 0; i < this.state.cuts.length; i++) {
                const cut = this.state.cuts[i];
                const length = this.state.lengths[i].length;
                const canvasLength = length * this.state.width / this.state.length;
                for (let n = 0; n < 2; n++) {
                    const mid = this.state.height / 4 + n * this.state.height / 2;
                    this.canvasCtx2.moveTo(canvasStart, mid);
                    for (let x = 0; x < canvasLength; x += 0.1) {
                        const offset = Math.floor((cut.sourceEnd - cut.sourceStart) * x / canvasLength);
                        const val = form[n][cut.sourceStart + offset] * cut.gain[n];
                        this.canvasCtx2.lineTo(
                            canvasStart + x,
                            mid + (val > 1 ? 1 : (val < -1 ? -1 : val)) * this.state.height / 4
                        );
                    }
                    this.canvasCtx2.stroke();
                }
                canvasStart += canvasLength;
            }
            this.setState({
                width: this.state.width
            });
        }
    }

    draw(drawpos=false) {
        if (!drawpos)
            this.drawbg();
        let cuts = this.state.lengths;
        let numCuts = 0;
        if ( this.state.lengths != undefined ) {
            numCuts = cuts.length;
        }
        this.canvasCtx.fillStyle = 'black';
        this.canvasCtx.fillRect(0, 0, this.state.width, this.state.height);
        this.canvasCtx.beginPath();

        const pos = this.state.position * 128;
        let cumsum = 0;
        let index = -1;
        if (drawpos) {
            while (++index < numCuts && pos >= cumsum) {
                if (!cuts[index].cropped)
                    cumsum += cuts[index].length;
            }
            index--;
        }

        const barWidth = (this.state.width / 200);
        
        let trackLength = this.state.length;
        let n = cuts.length;
        let running = 0;
        let offset = 0;
        for(let i = 0, x = 0; i < numCuts; i++) {
            if (drawpos) {
                if (i <= index && cuts[i].cropped)
                    offset += cuts[i].length;
            }
            x = running / trackLength * this.state.width;
            running += cuts[i].length;
            let nextx = running / trackLength * this.state.width;
            const barHeight = this.state.height;
            this.canvasCtx.fillStyle = 'red';
            //this.canvasCtx.fillStyle = 'rgb(' + (100 + x / this.state.width * 155) + ',50,50)';
            this.canvasCtx.fillRect(x, 0, barWidth, barHeight);
            if (cuts[i].cropped)
                this.canvasCtx.fillStyle = 'white';
            else
                this.canvasCtx.fillStyle = 'lightgreen';
            this.canvasCtx.font = "15px Arial";
            this.canvasCtx.fillText(i, (x + nextx) / 2, this.state.height/2);
        }
        if (this.interact.selected)
            this.canvasCtx.fillRect(this.interact.start, 0, this.interact.end - this.interact.start, this.state.height);
        if (drawpos)
            this.canvasCtx.fillRect((pos + offset) / trackLength * this.state.width, 0, barWidth, this.state.height);
    }

    render() {
        return (
            <div className="CutBar">
                {this.state.markers}
                <canvas ref={this.ref} width={this.state.width} height={this.state.height}></canvas>
                <canvas ref={this.bgref} width={this.state.width} height={this.state.height}></canvas>
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