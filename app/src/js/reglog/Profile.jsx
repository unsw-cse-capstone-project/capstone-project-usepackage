import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import Table from 'react-bootstrap/Table';

const dbURL = "http://localhost:8080"

export default class Profile extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            user: props.user,
            totalSize: 0,
            projects: [],
            cprojects: [],
            tags: {
                red: false,
                green: false,
                blue: false,
                yellow: false,
                purple: false
            },
            search: "",
            comparatorO: null,
            comparatorC: null
        }
        this.createProject = this.createProject.bind(this)
        this.deleteProject = this.deleteProject.bind(this)
        this.setSession = this.setSession.bind(this)
        this.tableInterface = this.tableInterface.bind(this)
        this.tableInterfaceCollab = this.tableInterfaceCollab.bind(this)
        this.getTotalSize = this.getTotalSize.bind(this)
        this.printTags = this.printTags.bind(this)
        this.changeTag = this.changeTag.bind(this)
        this.filterTags = this.filterTags.bind(this)
        this.updateTagg = this.updateTagg.bind(this)
        this.updateSearch = this.updateSearch.bind(this)
        this.comparatorSortNameAscending = this.comparatorSortNameAscending.bind(this)
        this.comparatorSortNameDescending = this.comparatorSortNameDescending.bind(this)
        this.comparatorSortDateAscending = this.comparatorSortDateAscending.bind(this)
        this.comparatorSortDateDescending = this.comparatorSortDateDescending.bind(this)
        this.setComparator = this.setComparator.bind(this)
        // this.shareLink = this.shareLink.bind(this)
        this.loadUser();
        this.loadProjects();
    }

    createProject() {
        let name = {
            projName: document.getElementById("projName").value
        }
        const requestOptions = {
            method: 'POST',
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
            } else if (message === "limit reached") {
                alert("You have reached the maximum number of projects each user can create: 5. Please delete some projects");
            } else {
                console.log(message);
                alert('yeah its not working dude');
            }
        }).catch(err => console.log(err));
    }

    deleteProject(e) {
        if (confirm("Are you sure you want to delete this project?")) {
            const requestOptions = {
                method: 'GET',
                headers: { 
                    'Authorization': localStorage.usertoken,
                    'ProjMetadata': e.target.getAttribute('aria-valuenow')
                }
            };
            fetch('/projects/deleteall', requestOptions).then( () => {
                fetch('projects/deleteproject', requestOptions).then( () => {
                    this.loadProjects();
                    this.getTotalSize();
                });
            });
        } else return;
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

    changeTag(e, colour, booleo) {
        const item = e.target.getAttribute('aria-valuenow')
        // console.log(item + " COLOUR: " + colour, " BOOLEO: " + booleo )

        // we have:
        // the name of the project, 
        // the owner of the project, 
        // the color tag we wish to change, and
        // the boolean we want to set the colour tag to

        // we want to:
        // change the tag using a fetch request
        const tagReq = JSON.stringify({
            colour: colour,
            state: booleo
        });
        const requestOptions = {
            method: 'GET',
            headers: { 
                'authorization': localStorage.usertoken,
                'ProjMetadata': item,
                'Tag': tagReq 
            }
        }
        fetch('/projects/changetag', requestOptions)
        .then(data => 
            data.body.getReader())
        .then(reader => reader.read())
        .then(data => {
            const message = new TextDecoder("utf-8").decode(data.value)
            if(message === "success") {
                this.loadProjects();
            } else {
                alert();
            }
        })
        .catch(err => console.log(err));
    }

    printTags(item) {
        const tags = item.tags
        const red    = tags.red    === true ? 
                         <span aria-valuenow={JSON.stringify(item)} style={{color:    "red", fontSize: "20px"}} onClick={(e) => this.changeTag(e,    "red", false)}>★</span> : 
                         <span aria-valuenow={JSON.stringify(item)} style={{color:    "red", fontSize: "20px"}} onClick={(e) => this.changeTag(e,    "red",  true)}>☆</span>
        const green  = tags.green  === true ? 
                         <span aria-valuenow={JSON.stringify(item)} style={{color:  "green", fontSize: "20px"}} onClick={(e) => this.changeTag(e,  "green", false)}>★</span> : 
                         <span aria-valuenow={JSON.stringify(item)} style={{color:  "green", fontSize: "20px"}} onClick={(e) => this.changeTag(e,  "green",  true)}>☆</span>
        const blue   = tags.blue   === true ? 
                         <span aria-valuenow={JSON.stringify(item)} style={{color:   "blue", fontSize: "20px"}} onClick={(e) => this.changeTag(e,   "blue", false)}>★</span> : 
                         <span aria-valuenow={JSON.stringify(item)} style={{color:   "blue", fontSize: "20px"}} onClick={(e) => this.changeTag(e,   "blue",  true)}>☆</span>
        const yellow = tags.yellow === true ? 
                         <span aria-valuenow={JSON.stringify(item)} style={{color: "orange", fontSize: "20px"}} onClick={(e) => this.changeTag(e, "yellow", false)}>★</span> : 
                         <span aria-valuenow={JSON.stringify(item)} style={{color: "orange", fontSize: "20px"}} onClick={(e) => this.changeTag(e, "yellow",  true)}>☆</span>
        const purple = tags.purple === true ? 
                         <span aria-valuenow={JSON.stringify(item)} style={{color: "purple", fontSize: "20px"}} onClick={(e) => this.changeTag(e, "purple", false)}>★</span> : 
                         <span aria-valuenow={JSON.stringify(item)} style={{color: "purple", fontSize: "20px"}} onClick={(e) => this.changeTag(e, "purple",  true)}>☆</span>
        return (
            <td>
                {red}&nbsp;
                {green}&nbsp;
                {blue}&nbsp;
                {yellow}&nbsp;
                {purple}&nbsp;
            </td>
        );
    }

    comparatorSortNameAscending(a, b) {
        return a.name.localeCompare(b.name)
    }

    comparatorSortNameDescending(a, b) {
        return b.name.localeCompare(a.name)
    }

    comparatorSortDateAscending(a, b) {
        const adate = new Date(a.date)
        const bdate = new Date(b.date)
        return a.date.localeCompare(b.date)
    }

    comparatorSortDateDescending(a, b) {
        const adate = new Date(a.date)
        const bdate = new Date(b.date)
        return b.date.localeCompare(a.date)
    }

    loadProjects() {
        const requestOptions = {
            method: 'GET',
            headers: { 
                'authorization': localStorage.usertoken,
                'Tag': JSON.stringify(this.state.tags),
                'Search': this.state.search
            }
        };
        fetch('/projects/', requestOptions).then(jsonRes => {
            return jsonRes.json();
        }).then(jsonData => {
            if (this.state.comparatorO !== null) {
                jsonData[0].sort(this.state.comparatorO);
            }
            if (this.state.comparatorC !== null) {
                jsonData[0].sort(this.state.comparatorC);
            }
            this.setState({
                projects: jsonData[0].map((item, num) => {
                    const date = new Date(item.date);
                    const dateString = date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes();
                    // return <li key={num} aria-valuenow={JSON.stringify(item)} onClick={(e) => this.setSession(e)}>{item.name}</li>
                    return (
                        <tr key={num} >
                            <td>{num + 1}</td>
                            <td aria-valuenow={JSON.stringify(item)} onClick={(e) => this.setSession(e)}>{item.name}</td>
                            <td>{item.owner}</td>
                            {this.printTags(item)}
                            <td>{dateString}</td>
                            <td><Button aria-valuenow={JSON.stringify(item)} onClick={(e) => this.deleteProject(e)} variant="danger">Delete</Button></td>
                            <td><ShareLinkModal inf={JSON.stringify(item)} name={"Share"} variant={"info"}/></td>
                        </tr>
                    )
                }),
                cprojects: jsonData[1].map((item, num) => {
                    const date = new Date(item.date);
                    const dateString = date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes();
                    // return <li key={num} aria-valuenow={JSON.stringify(item)} onClick={(e) => this.setSession(e)}>{item.name}</li>
                    return (
                        <tr key={num}>
                            <td>{num + 1}</td>
                            <td aria-valuenow={JSON.stringify(item)} onClick={(e) => this.setSession(e)}>{item.name}</td>
                            <td>{item.owner}</td>
                            {this.printTags(item)}
                            <td>{dateString}</td>
                        </tr>
                    )
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

    tableInterface() {
        return (
            <Table striped bordered hover size="sm">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Project name <span style={{color: "green"}} onClick={() => this.setComparator(1, 0)}>▲</span>&nbsp;<span style={{color: "red"}} onClick={() => this.setComparator(2, 0)}>▼</span></th>
                        <th>Owner</th>
                        <th>Tags</th>
                        <th>Last Modified <span style={{color: "green"}} onClick={() => this.setComparator(3, 0)}>▲</span>&nbsp;<span style={{color: "red"}} onClick={() => this.setComparator(4, 0)}>▼</span></th>
                        <th>Delete</th>
                        <th>Share</th>
                    </tr>
                </thead>
                <tbody>
                    {this.state.projects}
                </tbody>
            </Table>
        )
    }

    tableInterfaceCollab() {
        return (
            <Table striped bordered hover size="sm">
                <thead>
                    <tr>
                    <th>#</th>
                        <th>Project name <span style={{color: "green"}} onClick={() => this.setComparator(1, 1)}>▲</span>&nbsp;<span style={{color: "red"}} onClick={() => this.setComparator(2, 1)}>▼</span></th>
                        <th>Owner</th>
                        <th>Tags</th>
                        <th>Last Modified <span style={{color: "green"}} onClick={() => this.setComparator(3, 1)}>▲</span>&nbsp;<span style={{color: "red"}} onClick={() => this.setComparator(4, 1)}>▼</span></th>
                    </tr>
                </thead>
                <tbody>
                        {this.state.cprojects}
                </tbody>
            </Table>
        )
    }

    componentWillMount() {
        this.getTotalSize()
    }

    getTotalSize() {
        const requestOptions = {
            method: 'GET',
            headers: { 
                'authorization': localStorage.usertoken
            }
        };
        fetch('/projects/totalspace', requestOptions)
        .then(data => 
            data.body.getReader())
        .then(reader => reader.read())
        .then(data => {
            const message = new TextDecoder("utf-8").decode(data.value)
            this.setState({
                totalSize: (parseInt(message) / 1048576).toFixed(3)
            })
        }).catch(err => console.log(err));
    }

    updateTagg(colour, state) {
        this.setState({
            tags: {
                ...this.state.tags,
                [colour]: state
            }
        }, () => {
            this.loadProjects();
        });
    }

    filterTags() {
        const tags = this.state.tags
        const red    = tags.red    === true ? 
                         <span style={{color:    "red", fontSize: "20px"}} onClick={()=>this.updateTagg("red", false)}>★</span> : 
                         <span style={{color:    "red", fontSize: "20px"}} onClick={()=>this.updateTagg("red",  true)}>☆</span>
        const green  = tags.green  === true ? 
                         <span style={{color:  "green", fontSize: "20px"}} onClick={()=>this.updateTagg("green", false)}>★</span> : 
                         <span style={{color:  "green", fontSize: "20px"}} onClick={()=>this.updateTagg("green",  true)}>☆</span>
        const blue   = tags.blue   === true ? 
                         <span style={{color:   "blue", fontSize: "20px"}} onClick={()=>this.updateTagg("blue", false)}>★</span> : 
                         <span style={{color:   "blue", fontSize: "20px"}} onClick={()=>this.updateTagg("blue",  true)}>☆</span>
        const yellow = tags.yellow === true ? 
                         <span style={{color: "orange", fontSize: "20px"}} onClick={()=>this.updateTagg("yellow", false)}>★</span> : 
                         <span style={{color: "orange", fontSize: "20px"}} onClick={()=>this.updateTagg("yellow",  true)}>☆</span>
        const purple = tags.purple === true ? 
                         <span style={{color: "purple", fontSize: "20px"}} onClick={()=>this.updateTagg("purple", false)}>★</span> : 
                         <span style={{color: "purple", fontSize: "20px"}} onClick={()=>this.updateTagg("purple",  true)}>☆</span>
        return (<>
                {red}&nbsp;
                {green}&nbsp;
                {blue}&nbsp;
                {yellow}&nbsp;
                {purple}&nbsp;
                </>
        );
    }

    updateSearch() {
        const search = document.getElementById("searchbar").value
        this.setState({
            search: search
        }, () => {
            this.loadProjects();
        });
    }

    setComparator(i, w) {
        if(w === 0) {
            switch(i) {
                case 1:
                    this.setState({
                        comparatorO: this.comparatorSortNameAscending
                    })
                    break;
                case 2:
                    this.setState({
                        comparatorO: this.comparatorSortNameDescending
                    })
                    break;
                case 3:
                    this.setState({
                        comparatorO: this.comparatorSortDateAscending
                    })
                    break;
                case 4:
                    this.setState({
                        comparatorO: this.comparatorSortDateDescending
                    })
                    break;
                default:
                    this.setState({
                        comparatorO: null
                    })
                    break;
            }
        } else {
            switch(i) {
                case 1:
                    this.setState({
                        comparatorC: this.comparatorSortNameAscending
                    })
                    break;
                case 2:
                    this.setState({
                        comparatorC: this.comparatorSortNameDescending
                    })
                    break;
                case 3:
                    this.setState({
                        comparatorC: this.comparatorSortDateAscending
                    })
                    break;
                case 4:
                    this.setState({
                        comparatorC: this.comparatorSortDateDescending
                    })
                    break;
                default:
                    this.setState({
                        comparatorC: null
                    })
                    break;
            }
        }
        this.loadProjects();
    }

    render() {
        return ( 
            <div className="row">
                <div className="col-12"><h1>Profile for {this.state.user}</h1></div>
                <div className="col-4">
                    <CreateProjectModal handler={this.createProject} name={"Create Project"} variant={"success"}/>
                </div>
                <div className="col-2">
                    <FormControl type="text" placeholder="Search" id="searchbar"/>
                    <h4>Tag Filter: </h4>{this.filterTags()}
                </div>
                <div className="col-1">
                    <Button variant="outline-success" onClick={() => this.updateSearch()}>Search</Button>
                </div>
                <div className="col-6 projectList">
                    <h2>{this.state.user}'s Projects</h2>
                    {this.state.projects.length === 0 ? "No projects" : this.tableInterface()}
                    <p>Total of {this.state.totalSize}MB out of 200MB used</p>
                </div>
                <div className="col-6 projectList">
                    <h2>Collaborations</h2>
                    {this.state.cprojects.length === 0 ? "No projects" : this.tableInterfaceCollab()}
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

export function ShareLinkModal(props) {
    const [show, setShow] = React.useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const inf = JSON.parse(props.inf)
    const link = 'http://localhost:8080/collabs/' + inf.owner + '/' + inf.name + '/' + inf.str;
    return (
    <>
        <Button variant={props.variant} onClick={handleShow}>{props.name}</Button>
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Share Link</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div>{link}</div>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
                Close
            </Button>
            <Button variant="primary" onClick={handleClose}>
                Ok
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