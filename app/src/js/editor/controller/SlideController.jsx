import React from 'react';
import PropTypes from 'prop-types';

export default class GainController extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: 1
        }
        this.handler = this.handler.bind(this);
    }

    handler(e, i) {
        this.setState({value: e.target.value});
        this.props.handler(e.target, i);
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

GainController.propTypes = {
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    handler: PropTypes.func
}
