import React from 'react'
import Form from 'react-bootstrap/Form'

export default class Slider extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            value: 50
        };
        props.regUpdate(this.updateVal.bind(this));
    }

    updateVal(val) {
        this.setState({
            value: val
        });
    }


    modify(e) {
        this.props.changeCallBack(e.target);
        this.setState({
            value: e.target.value
        });
    }

    render() {
        return (
            <Form>
                <Form.Group controlId={this.props.id}>
                    <Form.Label>{this.props.name}</Form.Label>
                    <Form.Control value={this.state.value} type="range" orient="vertical" className=".slider" onChange={this.modify.bind(this)} custom>
                    </Form.Control>
                </Form.Group>
            </Form>
        );
    }
}