import React from 'react';
import PropTypes from 'prop-types';

export default class SlideController extends React.Component {
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
            <div className="slider">
                <div className="sliderTitle"> 
                    <p>{this.props.text}</p> 
                </div>
                <div className="sliderRange">
                    <input type="range" 
                        onChange={this.handler} 
                        min={this.props.min} 
                        max={this.props.max} 
                        value={this.state.value} 
                        step={this.props.step}>
                    </input> 
                </div>
            </div>
        );
    }
}

SlideController.propTypes = {
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    text: PropTypes.string,
    handler: PropTypes.func
}
