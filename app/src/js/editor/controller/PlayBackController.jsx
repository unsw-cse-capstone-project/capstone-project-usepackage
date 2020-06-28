import React from 'react';
import PropTypes from 'prop-types';

export default class PlayBackController extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: 1
        }
        this.handler = this.handler.bind(this);
    }

    handler(e) {
        this.setState({value: e.target.value});
        this.props.handler(e.target);
    }

    render() {
        return  ( 
        <input type="range" 
            onChange={this.handler} 
            min={this.props.min} 
            max={this.props.max} 
            value={this.state.value} 
            step={this.props.step}>
        </input> );
    }
}

PlayBackController.propTypes = {
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    handler: PropTypes.func
}
