import React from 'react'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'

const dbURL = "http://localhost:5000"

export default class RegisterContainer extends React.Component {
    constructor(props) {
        super(props);
        this.handleRegistration = this.handleRegistration.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    handleRegistration() {
        let formResponse = {
            first_name: document.getElementById("firstName").value,
            last_name: document.getElementById("lastName").value,
            username: document.getElementById("username").value,
            password: document.getElementById("formPassword").value,
            confirmPassword: document.getElementById("formConfirmPassword").value
        }
        sendRego(formResponse).then((message) => {
            if(message === "success") {
                const alert = document.getElementById('reg-status');
                console.log(alert);
                alert.className = 'fade alert alert-success show'
                alert.innerHTML = "Registration Successful!"
                alert.removeAttribute("hidden");
            }
            else {
                const alert = document.getElementById('reg-status');
                console.log(alert);
                alert.className = 'fade alert alert-danger show'
                alert.innerHTML = message
                alert.removeAttribute("hidden");
            }
        })
    }

    handleKeyPress(event) {
        if(event.key === 'Enter') this.handleLogin();
    }

    render() {
        return (
            <Form onKeyPress={this.handleKeyPress}>
                <Alert variant="primary" hidden id="reg-status">
                    <p>This is a placeholder message. Contact the developers if you see this message.</p>
                </Alert>
                <Form.Group controlId="firstName">
                    <Form.Label>First name</Form.Label>
                    <Form.Control type="text" placeholder="Plase enter your first name" />
                </Form.Group>

                <Form.Group controlId="lastName">
                    <Form.Label>Last name</Form.Label>
                    <Form.Control type="text" placeholder="Please enter your last name" />
                </Form.Group>

                <Form.Group controlId="username">
                    <Form.Label>User name</Form.Label>
                    <Form.Control type="text" placeholder="Enter username" />
                </Form.Group>

                <Form.Group controlId="formPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" />
                </Form.Group>

                <Form.Group controlId="formConfirmPassword">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control type="password" />
                </Form.Group>

                <Button onClick={this.handleRegistration} variant="primary">Submit</Button>
            </Form>
        );
    }
}

const sendRego = (obj) => {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
    };
    
    return new Promise((resolve) => fetch(dbURL + '/users/register', requestOptions)
    .then(data => 
        data.body.getReader())
    .then(reader => reader.read())
    .then(data => {
        const message = new TextDecoder("utf-8").decode(data.value)
        resolve(message)
    })).catch(err => console.log(err));
}