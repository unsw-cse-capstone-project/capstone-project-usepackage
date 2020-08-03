import React from 'react'
import Form from 'react-bootstrap/Form'

export default class Slider extends React.Component {
    constructor(props) {
        super(props)
    }


    render() {
        return (
            <Form>
                <Form.Group controlId={this.props.id}>
                    <Form.Label>{this.props.name}</Form.Label>
                    <Form.Control type="range" orient="vertical" className=".slider" onChange={e => this.props.changeCallBack(e.target)} custom>
                    </Form.Control>
                </Form.Group>
            </Form>
        );
    }
}