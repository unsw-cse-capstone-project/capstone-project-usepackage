import React from 'react';
import PropTypes from 'prop-types';

export default class CutBar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            width: props.width,
            height: props.height,
            cuts: [{
                length: 1,
                cropped: false
            }],
            cropped: [],
            duration: 1,
            position: 0,
            length: 1
        }
        this.cutCB = props.cutCB;
        this.ref = React.createRef();
        this.draw = this.draw.bind(this);
        props.regLen(this.drawLengths.bind(this));
        props.regPos(this.drawMove.bind(this));
    }

    componentDidMount() {
        const canvas = this.ref.current;
        canvas.addEventListener('click', (e) => {
            console.log(e);
            console.log("cutbar length:", this.state.length);
            if (this.cutCB){
                const time = e.offsetX / this.state.width * this.state.length
                this.cutCB(time);
                // for(let i = 0, run = 0; i < this.state.cuts.length; i++){
                //     run+= this.state.cuts[i].length;
                //     if(run === time) break;
                //     if(run > time) {
                //         this.state.cuts.splice(i+1, 0, [{length: this.state.cuts[i].length - (time - run), cropped: this.state.cuts[i].cropped}]);
                //         this.state.cuts[i].length = time - run;
                //         break;
                //     }
                //     // if(i === this.state.cuts.length - 1){
                        
                //     //     this.state.cuts.push(time);
                //     //     break;
                //     // }
                // }
                // this.setState({cuts: this.state.cuts});
            }
        });
        this.canvasCtx = canvas.getContext("2d");
        this.draw();
    }

    drawLengths(lengths) {
        this.setState({
            cuts: lengths,
            cropped: lengths.filter(v => v.cropped),
            length: lengths.reduce((a, b) => (a + b.length), 0)
        });
        this.draw();
    }

    drawMove(position) {
        console.log(position);
        this.setState({
            position: position.time
        });
        this.draw(true);
    }

    draw(drawpos=false) {
        let cuts = this.state.cuts;
        let numCuts = 0;
        if ( this.state.cuts != undefined ) {
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
            // Add variable that is dependent on cut
            (i % 2 == 0) ? this.canvasCtx.fillStyle = 'red' : this.canvasCtx.fillStyle = 'blue';
            //this.canvasCtx.fillStyle = 'rgb(' + (100 + x / this.state.width * 155) + ',50,50)';
            this.canvasCtx.fillRect(x, 0, barWidth, barHeight);
            if (cuts[i].cropped)
                this.canvasCtx.fillStyle = 'white';
            else
                this.canvasCtx.fillStyle = 'yellow';
            this.canvasCtx.font = "15px Arial";
            this.canvasCtx.fillText(i, (x + nextx) / 2, this.state.height/2);
        }
        if (drawpos)
            this.canvasCtx.fillRect((pos + offset) / trackLength * this.state.width, 0, barWidth, this.state.height);
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