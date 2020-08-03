import React from 'react'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'

const dbURL = "http://localhost:8080"

export default class LoginContainer extends React.Component {
    constructor(props) {
        super(props);
        this.handleLogin = this.handleLogin.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    handleLogin() {
        let formResponse = {
            username: document.getElementById("username").value,
            password: document.getElementById("formPassword").value
        }
        sendLogin(formResponse).then((message) => {
            if(message.includes("error: ") || message == "Incorrect username or password") {
                const alert = document.getElementById('reg-status');
                console.log(alert);
                alert.className = 'fade alert alert-danger show';
                alert.innerHTML = message;
                alert.removeAttribute("hidden");
            }
            else {
                const alert = document.getElementById('reg-status');
                console.log(alert);
                alert.className = 'fade alert alert-success show'
                alert.innerHTML = "Login successful! Redirecting"
                alert.removeAttribute("hidden");
                localStorage.setItem('usertoken', message);
                const a = document.createElement('a');
                a.href = "/profile";
                a.hidden = true;
                document.body.appendChild(a);
                a.click();
            }
        }).catch(err => console.log(err))
    }

    handleKeyPress(event) {
        if(event.key === 'Enter') this.handleRegistration();
    }


    render() {
        return (
            <div class="container">
                <div class="col-md-3">
                    <h1 class="header-padding">Login</h1>
                    <Form onKeyPress={this.handleKeyPress}>
                        <Alert variant="primary" hidden id="reg-status">
                            <p>This is a placeholder message. Contact the developers if you see this message.</p>
                        </Alert>
                        <Form.Group controlId="username">
                            <Form.Label>User name</Form.Label>
                            <Form.Control type="text" placeholder="Enter username" />
                        </Form.Group>

                        <Form.Group controlId="formPassword">
                            <Form.Label>Password</Form.Label>
                            <Form.Control type="password" />
                        </Form.Group>

                        <Button onClick={this.handleLogin} variant="primary">Submit</Button>
                    </Form>
                </div>
            </div>
        );
    }
}

const sendLogin = (obj) => {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
    };
    
    return new Promise((resolve) => fetch('/users/login', requestOptions)
    .then(data => 
        data.body.getReader())
    .then(reader => reader.read())
    .then(data => {
        const message = new TextDecoder("utf-8").decode(data.value)
        resolve(message)
    })).catch(err => console.log(err));
}