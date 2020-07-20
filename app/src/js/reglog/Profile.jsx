import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';

const dbURL = "http://localhost:8080"

export default class Profile extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            user: props.user,
            projects: [],
            cprojects: []
        }
        this.createProject = this.createProject.bind(this)
        this.deleteProject = this.deleteProject.bind(this)
        this.setSession = this.setSession.bind(this)
        this.loadUser();
        this.loadProjects();
    }

    createProject() {
        let name = {
            projName: document.getElementById("projName").value
        }
        const requestOptions = {
            method: 'post',
            headers: {
                'Authorization': localStorage.usertoken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                projectName: name.projName
            })
        };
        fetch('/projects/create', requestOptions)
        .then(data => 
            data.body.getReader())
        .then(reader => reader.read())
        .then(data => {
            const message = new TextDecoder("utf-8").decode(data.value)
            if(message === "success") {
                alert('success');
                this.loadProjects();
            } else if (message === "fail") {
                alert('A project with the same name already exists. Try a different name.arguments');
            } else {
                console.log(message);
                alert('yeah its not working dude');
            }
        }).catch(err => console.log(err));
    }

    deleteProject() {
        console.log("DELETING PROJECT")
    }

    setSession(e) {
        const item = e.target.getAttribute('aria-valuenow')
        console.log(item)
        if(localStorage.getItem('poname')) {
            localStorage.removeItem('poname');
        }
        localStorage.setItem('poname', item);
        const a = document.createElement('a');
        a.href = "/";
        a.hidden = true;
        document.body.appendChild(a);
        a.click();
    }

    loadProjects() {
        const requestOptions = {
            method: 'GET',
            headers: { 
                'authorization': localStorage.usertoken
            }
        };
        fetch('/projects/', requestOptions).then(jsonRes => {
            return jsonRes.json();
        }).then(jsonData => {
            this.setState({
                projects: jsonData[0].map((item, num) => {
                    return <li key={num} aria-valuenow={JSON.stringify(item)} onClick={(e) => this.setSession(e)}>{item.name}</li>
                }),
                cprojects: jsonData[1].map((item, num) => {
                    return <li key={num} aria-valuenow={JSON.stringify(item)} onClick={(e) => this.setSession(e)}>{item.name}</li>
                })
            })
        })
    }

    loadUser() {
        const requestOptions = {
            method: 'GET',
            headers: { 
                'authorization': localStorage.usertoken
            }
        };
        fetch('/users/userInfo', requestOptions)
        .then(data => 
            data.body.getReader())
        .then(reader => reader.read())
        .then(data => {
            const message = new TextDecoder("utf-8").decode(data.value)
            this.setState({user: message})
        }).catch(err => console.log(err));
    }

    render() {
        return ( 
            <div className="row">
                <div className="col-12"><h1>Profile for {this.state.user}</h1></div>
                <div className="col-4">
                    <CreateProjectModal handler={this.createProject} name={"Create Project"} variant={"success"}/>
                </div>
                <div className="col-4">
                    <DeleteProjectModal handler={this.deleteProject} name={"Delete Project"} variant={"danger"}/>
                </div>
                <div className="col-5 projectList">
                    <h2>{this.state.user}'s Projects</h2>
                    <ul className="projectList">
                        {this.state.projects.length === 0 ? "No projects" : this.state.projects}                    
                    </ul>
                </div>
                <div className="col-5 projectList">
                    <h2>Collaborations</h2>
                    <ul className="projectList">
                        {this.state.cprojects.length === 0 ? "No projects" : this.state.cprojects} 
                    </ul>
                </div>
            </div>
        );
        }

}

export function CreateProjectModal(props) {
    const [show, setShow] = React.useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true); 
    return (
    <>
        <Button variant={props.variant} onClick={handleShow}>{props.name}</Button>
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Create New Project</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <InputGroup>
                    <InputGroup.Prepend>
                        <InputGroup.Text id="inputGroup-sizing-default">Project Name</InputGroup.Text>
                    </InputGroup.Prepend>
                    <FormControl id="projName"
                    aria-label="Default"
                    aria-describedby="inputGroup-sizing-default"
                    />
                </InputGroup> 
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
                Close
            </Button>
            <Button variant="primary" onClick={props.handler}>
                Apply
            </Button>
            </Modal.Footer>
        </Modal>
    </>
    );
}

export function DeleteProjectModal(props) {
    const [show, setShow] = React.useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true); 
    return (
    <>
        <Button variant={props.variant} onClick={handleShow}>{props.name}</Button>
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Deleting project(s)</Modal.Title>
            </Modal.Header>
            <Modal.Body>Are you sure you want to delete these project(s)?</Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
                No
            </Button>
            <Button variant="danger" onClick={props.handler}>
                Yes
            </Button>
            </Modal.Footer>
        </Modal>
    </>
    );
}

Profile.defaultProps = {
    user: "Test"
}