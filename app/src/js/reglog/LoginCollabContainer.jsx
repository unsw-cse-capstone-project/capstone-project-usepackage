import React from 'react'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'

export default class LoginCollabContainer extends React.Component {
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
                const alertt = document.getElementById('reg-status');
                console.log(alertt);
                alertt.className = 'fade alert alert-danger show';
                alertt.innerHTML = message;
                alertt.removeAttribute("hidden");
            }
            else {
                const alertt = document.getElementById('reg-status');
                console.log(alertt);
                alertt.className = 'fade alert alert-success show'
                alertt.innerHTML = "Login successful! Redirecting"
                alertt.removeAttribute("hidden");
                localStorage.setItem('usertoken', message);

                // we need to add the user to the collaborators and then redirect the user to the proj page.

                const args = window.location.href.toString().slice(30).split("/");

                const fields = {
                    owner: args[0],
                    name: args[1],
                    ranstr: args[2]
                }
                const requestOptions = {
                    method: 'GET',
                    headers: { 
                        'Authorization': localStorage.usertoken,
                        'ProjectCollab': JSON.stringify(fields)
                    }
                };
                fetch('http://localhost:8080/projects/addcollaborator', requestOptions)
                .then(res => {
                    // alert(res)
                    if(res.status === 200) return res.json();
                    else {
                        alertt.className = 'fade alert alert-danger show'
                        alertt.innerHTML = "Invalid Collaboration Link!"
                        localStorage.removeItem('usertoken')
                        throw new Error("Invalid!")
                    }
                })
                .then(data => {
                    // alert(data)
                    localStorage.setItem('poname', JSON.stringify(data));
                    const a = document.createElement('a');
                    a.href = "/";
                    a.hidden = true;
                    document.body.appendChild(a);
                    a.click();
                }).catch(err => console.log(err))
                
                // upon success, set poname to the proj and then go home
            }
        }).catch(err => console.log(err))
    }

    handleKeyPress(event) {
        if(event.key === 'Enter') this.handleRegistration();
    }


    render() {
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-12">
                        <h1 className="header-padding">Collaboration Registration</h1>
                    </div>
                    <div className="col-md-12">Please log in to join the project as a collaborator.</div>
                    <div className="col-md-3">
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