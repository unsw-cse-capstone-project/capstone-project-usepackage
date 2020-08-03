import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import Table from 'react-bootstrap/Table';
import {fetchPost, fetchGet, fetchGetJSON} from '../extramodules/custfetch';
import ProgressBar from 'react-bootstrap/ProgressBar';


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
                orange: false,
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
        const optBody = JSON.stringify({ projectName: name.projName })
        fetchPost('/projects/create',{'Content-Type': 'application/json'},optBody).then(message => {
            if(message === "success") {
                alert('success');
                this.loadProjects();
            } else if (message === "fail") {
                alert('A project with the same name already exists. Try a different name.arguments');
            } else if (message === "limit reached") {
                alert("You have reached the maximum number of projects each user can create: 5. Please delete some projects");
            } else if (message === "spcchar") {
                alert("Project names cannot contain special characters, including spaces (with the exception of \"_\")");
            } else {
                console.log(message);
                alert('yeah its not working dude');
            }
        }).catch(err => console.log(err));
    }

    deleteProject(e) {
        if (confirm("Are you sure you want to delete this project?")) {
            const opts = {
                'projmetadata': e.target.getAttribute('aria-valuenow')
            }
            fetchGet('/projects/deleteall', opts).then(message => {
                fetchGet('projects/deleteproject', opts).then(message => {
                    this.loadProjects();
                    this.getTotalSize();
                });
            })
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
        const opts = {
            'projmetadata': item,
            'Tag': tagReq 
        }
        fetchGet('/projects/changetag', opts).then(message => {
            if(message === "success") {
                this.loadProjects();
            } else {
                alert();
            }
        })
        .catch(err => console.log(err));
    }

    printTags(item) {
        const cols = ["red", "green", "blue", "orange", "purple"]
        const tags = item.tags
        const tagVals = cols.map((col, i) => {
            if ( tags[col] === true ) {
                return (
                <span key={col+i.toString()+"1"} aria-valuenow={JSON.stringify(item)} 
                    style={{color: col, fontSize: "20px"}} 
                    onClick={(e) => this.changeTag(e, col, false)}>
                    ★
                </span>);  
            } else {
                return (
                <span key={col+i.toString()+"1"} aria-valuenow={JSON.stringify(item)} 
                    style={{color: col, fontSize: "20px"}} 
                    onClick={(e) => this.changeTag(e, col, true)}>
                    ☆
                </span>);
            }
        })
        return (
            <td>
                {tagVals}
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
        // return a.date.localeCompare(b.date)
        // console.log(adate + " < " + bdate + " = " + (adate < bdate).toString())
        return adate - bdate;
    }

    comparatorSortDateDescending(a, b) {
        const adate = new Date(a.date)
        const bdate = new Date(b.date)
        // return b.date.localeCompare(a.date)
        // console.log(adate + " > " + bdate + " = " + (adate > bdate).toString())
        return bdate - adate;
    }

    loadProjects() {
        const opts = {
            'Tag': JSON.stringify(this.state.tags),
            'Search': this.state.search
        }
        fetchGetJSON('/projects/', opts).then(jsonData => {
            if (this.state.comparatorO !== null) {
                jsonData[0].sort(this.state.comparatorO);
            }
            if (this.state.comparatorC !== null) {
                jsonData[0].sort(this.state.comparatorC);
            }
            this.setState({
                projects: jsonData[0].map((item, num) => {
                    const date = new Date(item.date);
                    const dateString = String(date.getDate()).padStart(2, "0") + "/" + String(date.getMonth()).padStart(2, "0") + "/" + String(date.getFullYear()).padStart(2, "0") + " " + 
                                       String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
                    return (
                        <tr key={num} >
                            <td>{num + 1}</td>
                            <td aria-valuenow={JSON.stringify(item)} className="projname" onClick={(e) => this.setSession(e)}>{item.name}</td>
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
                    const dateString = String(date.getDate()).padStart(2, "0") + "/" + String(date.getMonth()).padStart(2, "0") + "/" + String(date.getFullYear()).padStart(2, "0") + " " + 
                                       String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
                    return (
                        <tr key={num}>
                            <td>{num + 1}</td>
                            <td aria-valuenow={JSON.stringify(item)} className="projname" onClick={(e) => this.setSession(e)}>{item.name}</td>
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
        fetchGet('/users/userInfo').then(message => {
            this.setState({user: message})
        }).catch(err => console.log(err));
    }

    tableInterface() {
        const upArrowName = <span style={{color: "green"}}  onClick={() => this.setComparator(1, 0)}> ▲ </span>
        const downArrowName = <span style={{color: "red"}} onClick={() => this.setComparator(2, 0)}> ▼ </span>
        const upArrowDate = <span style={{color: "green"}}  onClick={() => this.setComparator(3, 0)}> ▲ </span>
        const downArrowDate = <span style={{color: "red"}} onClick={() => this.setComparator(4, 0)}> ▼ </span>
        const tblheadVals = [
            "#", 
            <>Project Name {upArrowName} {downArrowName}</>, 
            "Owner", 
            "Tags", 
            <>Last Modified {upArrowDate} {downArrowDate}</>, 
            "Delete", 
            "Share"
        ]
        const tblhead = tblheadVals.map((item, i) => {
            return (
                <th key={item + i}>{item}</th>
            )
        })
        return (
            <Table striped bordered hover size="sm">
                <thead>
                    <tr>
                        {tblhead}
                    </tr>
                </thead>
                <tbody>
                    {this.state.projects}
                </tbody>
            </Table>
        )
    }

    tableInterfaceCollab() {
        const upArrowName = <span style={{color: "green"}}  onClick={() => this.setComparator(1, 1)}> ▲ </span>
        const downArrowName = <span style={{color: "red"}} onClick={() => this.setComparator(2, 1)}> ▼ </span>
        const upArrowDate = <span style={{color: "green"}}  onClick={() => this.setComparator(3, 1)}> ▲ </span>
        const downArrowDate = <span style={{color: "red"}} onClick={() => this.setComparator(4, 1)}> ▼ </span>
        const tblheadVals = [
            "#", 
            <>Project Name {upArrowName} {downArrowName}</>, 
            "Owner", 
            "Tags", 
            <>Last Modified {upArrowDate} {downArrowDate}</>
        ]
        const tblhead = tblheadVals.map((item, i) => {
            return (
                <th key={item+i}>{item}</th>
            )
        })
        return (
            <Table striped bordered hover size="sm">
                <thead>
                    <tr>
                    {tblhead}
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
        fetchGet('/projects/totalspace').then(message => {
            this.setState({totalSize: (parseInt(message) / 1048576).toFixed(3) })
        })
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
        const cols = ["red", "green", "blue", "orange", "purple"]
        const tags = this.state.tags
        const tagVals = cols.map((col, i) => {
            if ( tags[col] === true ) {
                return (
                <span key={col+i.toString()+"2"} 
                    style={{color: col, fontSize: "20px"}} 
                    onClick={()=>this.updateTagg(col, false)}>
                    ★
                </span>);  
            } else {
                return (
                <span key={col+i.toString()+"2"}
                    style={{color: col, fontSize: "20px"}} 
                    onClick={()=>this.updateTagg(col, true)}>
                    ☆
                </span>);
            }
        })
        return (
            <>
                {tagVals}
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
        // i --> 1, 2, 3, 4 indicates sort by nameascend, namedescend, dateascend, datedescend, respectively. 
        // w --> 0 indicates owner's project, 1 indicates collaborations
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
            <div class="container">
                <div className="row row-padding">
                    <div className="col-12"><h1 class="header-padding">Welcome {this.state.user}</h1></div>
                </div>
                <div className="row row-padding">
                    <div className="col-4">
                        <CreateProjectModal handler={this.createProject} name={"Create Project"} variant={"success"}/>
                    </div>
                    <div className="col-4"><h4 className="inline">Tag Filter: </h4>{this.filterTags()}</div>
                    <div className="col-4 right-align">
                        <FormControl className="form-control-inline" type="text" placeholder="Search" id="searchbar"/>
                        <Button variant="outline-success" onClick={() => this.updateSearch()} className="search-btn-padding">Search</Button>
                    </div>
                </div>
                <div className="row row-padding">
                    <div className="col-12 projectList">
                        <h2>My Projects</h2>
                        {this.state.projects.length === 0 ? "No projects" : this.tableInterface()}
                        <div class="col-6"><ProgressBar animated now={this.state.totalSize / 200 * 100} /></div><div class="col-6"></div>
                        <div class="col-6"><p>Total of {this.state.totalSize}MB out of 200MB used</p></div><div class="col-6"></div>
                    </div>
                    <div className="col-12 projectList">
                        <h2>Collaborations</h2>
                        {this.state.cprojects.length === 0 ? "No projects" : this.tableInterfaceCollab()}
                    </div>
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