import React from 'react';
import PropTypes from 'prop-types';

export default class CutElement extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            width: props.width,
            duration: props.duration,
            time: props.time,
            left: props.left,
            right: props.right,
            leftOff: props.left * props.width / props.duration,
            rightOff: props.right * props.width / props.duration,
            show: false,
            init: 0,
            initOffset: 0,
            offset: 0,
            index: props.index,
            regUpdate: props.regUpdate
        };
        this.editCB = props.editCB;
        this.openCB = props.openCB;
        this.markerRef = React.createRef();
        this.timeRef = React.createRef();
        props.regUpdate(
            props.index,
            this.update.bind(this),
            this.getOffset.bind(this),
            this.close.bind(this)
        );

        this.seekTo = this.seekTo.bind(this);
        this.seekToTime = this.seekToTime.bind(this);
    }

    close() {
        this.setState({
            show: false
        });
    }

    getOffset() {
        return this.state.time;
    }

    seekTo(cumsum) {
        if (cumsum < this.state.leftOff)
            cumsum = this.state.leftOff;
        else if (cumsum > this.state.rightOff)
            cumsum = this.state.rightOff;
        this.markerRef.current.style.left = cumsum + 'px';
        this.setState({
            offset: cumsum,
            time: cumsum * this.state.duration / this.state.width
        });
    }

    seekToTime(time) {
        if (time < this.state.left)
            time = this.state.left;
        else if (time > this.state.right)
            time = this.state.right;
        const cumsum = time * this.state.width / this.state.duration;
        this.markerRef.current.style.left = cumsum + 'px';
        this.setState({
            offset: cumsum,
            time: time
        });
    }

    componentDidMount() {
        this.markerRef.current.addEventListener('click', (e) => {
            if (!this.state.show) {
                this.openCB(this.state.index);
                this.setState({
                    show: true
                });
                e.preventDefault();
                return false;
            }
        });
        const listenerMove = (e) => {
            this.timeRef.current.removeAttribute('contenteditable');
            const diff = e.pageX - this.state.init;
            let newOffset = this.state.offset + diff;
            if (newOffset < this.state.leftOff)
                newOffset = this.state.leftOff;
            else if (newOffset > this.state.rightOff)
                newOffset = this.state.rightOff;
            if (newOffset != this.state.offset) {
                this.setState({
                    init: e.pageX
                });
                this.seekTo(newOffset);
            }
        };
        const listenerUp = () => {
            document.removeEventListener('mousemove', listenerMove);
            document.removeEventListener('mouseup', listenerUp);
            if (this.timeRef.current.getAttribute('contenteditable') !== null)
                document.execCommand('selectAll', false, null);
            else
                this.timeRef.current.setAttribute('contenteditable', "");
            if (this.state.initOffset != this.state.offset) {
                this.setState({
                    initOffset: this.state.offset
                });
                this.editCB(this.state.index, this.state.time);
            }
        };
        
        this.markerRef.current.addEventListener('mousedown', (e) => {
            this.setState({
                init: e.pageX,
                initOffset: this.state.offset
            });
            document.addEventListener('mousemove', listenerMove);
            document.addEventListener('mouseup', listenerUp);
        });

        const seekTime = () => {
            if (this.timeRef.current.getAttribute('contenteditable') !== null) {
                if (this.timeRef.current.innerText.match(/^\d+(?:\.\d+)?$/)) {
                    this.seekToTime(parseFloat(this.timeRef.current.innerText));
                    this.editCB(this.state.index, this.state.time);
                }
            }
        };
        this.timeRef.current.addEventListener('keydown', (e) => {
            if (e.key === "Enter") {
                seekTime();
                e.preventDefault();
            }
        });
        this.timeRef.current.addEventListener('paste', (e) => {
            const data = (e.clipboardData || window.clipboardData).getData('text');
            this.timeRef.current.innerText = data.replace(/(?:\n|\r)/g, '');
            seekTime();
            e.preventDefault();
        });
        this.timeRef.current.addEventListener('focusout', seekTime);

        this.seekToTime(this.state.time);
    }

    update(data) {
        this.setState({...data,
            initOffset: data.offset,
            leftOff: data.left * this.state.width / data.duration,
            rightOff: data.right * this.state.width / data.duration,
            show: false
        });
        this.state.regUpdate(
            this.state.index,
            this.update.bind(this),
            this.getOffset.bind(this),
            this.close.bind(this)
        );
        this.seekTo(this.state.offset);
    }

    render() {
        return (
            <div className="marker" ref={this.markerRef}>
                <div className="markerTime" ref={this.timeRef} show={this.state.show ? "" : undefined}>
                    {this.state.time.toFixed(3)}
                </div>
            </div>
        )
    }
}