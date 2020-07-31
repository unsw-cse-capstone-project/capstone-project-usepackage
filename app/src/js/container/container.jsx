import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import AudioStack from '../audioContainer/audioStack'
import Modal from 'react-bootstrap/Modal'
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';

const dbURL = "http://localhost:8080"

const addUpload = (fileURL, blob, resolve) => {
    const reader = new FileReader()
    reader.readAsArrayBuffer(blob);
    reader.onloadend = () => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        // Create an audio stream
        audioCtx.decodeAudioData(reader.result.slice()).then(audioData => {
            let state = {
                fileBuffer: reader.result,
                audioData: audioData,
                fileURL: fileURL,
                fileBlob: blob
            }
            resolve(state)          
        })
    }
}

export default class MainContainer extends React.Component {
    constructor(props) {
        super(props);
        this.audioStack = new AudioStack();
        this.state = {
            audioRecords: [],
            metadata: {
                title: "",
                artist: "",
                album: "",
                year: "",
                track: "",
                genre: "",
                comment: ""
            }
        }
        this.fileURLs = []
        this.addFiles = this.addFiles.bind(this);
        this.saveFiles = this.saveFiles.bind(this);
        this.uploadFiles = this.uploadFiles.bind(this);
        this.playAll = this.playAll.bind(this);
        this.loadFiles = this.loadFiles.bind(this);
        this.deleteCb = this.deleteCb.bind(this);
        this.updateMetadata = this.updateMetadata.bind(this);
        if (localStorage.usertoken && localStorage.poname) {
            window.onbeforeunload = () => {
                return "Please make sure that you saved your project before leaving!"
            }
            this.loadFiles();
        }
    }

    loadFiles() {
        // CHECK HERE IF USER CAN ACCESS PROJECT using /projects/attemptaccess

        let reque = {
            method: 'GET',
            headers: {
                'authorization': localStorage.usertoken,
                'projmetadata': localStorage.poname,
                'projectinfo' : localStorage.getItem('projecttoken') ? localStorage.projecttoken : ""
            }
        }
        // fetch('/projects/updateaccess', ...) ==> 

        fetch('/projects/attemptaccess', reque)
        .then(data => data.body.getReader())
        .then(reader => reader.read())
        .then(data => {
            const message = new TextDecoder("utf-8").decode(data.value);
            console.log(message);
            if(message === "Cannot allocate session!" || message === "Forbidden") return new Error(message);
            localStorage.setItem('projecttoken', message);
            console.log("obtaining number of files info");

            setInterval(() => {
                fetch('/projects/updateaccess', {
                    method: 'GET',
                    headers: {
                        'authorization': localStorage.usertoken,
                        'projmetadata': localStorage.poname,
                        'projectinfo': localStorage.projecttoken
                    }
                })
                .then(data => 
                    data.body.getReader())
                .then(reader => reader.read())
                .then(data => {
                    const message = new TextDecoder("utf-8").decode(data.value);

                    if(message === "Token does not match!") return new Error("Token does not match!");

                    localStorage.setItem('projecttoken', message);
                    console.log("token updated");
                }).catch(err => console.log(err));
            }, 30 * 1000);

            let len = 0;
            fetch('/projects/numfiles', reque)
            .then(data => 
                data.body.getReader())
            .then(reader => reader.read())
            .then(data => {
                const message = new TextDecoder("utf-8").decode(data.value)
                if(message === "fail") console.log(message);
                // console.log(message);
                len = parseInt(message);
                console.log("total number of files: ", len);
                console.log('fetching');
                for(let i = 0; i < len; i++) {
                    fetch('/projects/audiofiles', {
                        method: 'GET',
                        headers: {
                            'authorization': localStorage.usertoken,
                            'ProjMetadata': localStorage.poname,
                            'nth': i
                        }
                    }).then(file => {
                        return file.blob();
                    }).then(blob => {
                        return new Promise(resolve => {
                            addUpload(URL.createObjectURL(blob), blob, resolve);
                        });
                    }).then(audioRecord => {
                        // Process inside the audioStack
                        // MUST COME BEFORE THE STATE CHANGE!
                        this.audioStack.add(audioRecord, (msg) => this.deleteCb(msg) ) 
                        this.setState({
                            audioRecords: [...this.state.audioRecords, audioRecord]
                        })               
                    }).then(() => {
                        console.log("Audio stack tracks: ", this.audioStack.tracks);
                        // Empty the fileURLs since they have already been processed
                        this.fileURLs = [];
                    }).then(() => {
                        fetch('projects/getstack', {
                            method: 'GET',
                            headers: {
                                'authorization': localStorage.usertoken,
                                'ProjMetadata': localStorage.poname,
                                'nth': i
                            }
                        }).then(data => data.body.getReader())
                        .then(reader => reader.read())
                        .then(data => {
                            const message = new TextDecoder("utf-8").decode(data.value)
                            console.log("STACK!!! ", message)})
                    }).catch(err => {
                        console.log(err);
                    });
                }
            }).catch(err => console.log(err));
            fetch('projects/getmetadata', {
                method: 'GET',
                headers: {
                    'authorization': localStorage.usertoken,
                    'ProjMetadata': localStorage.poname
                }
            })
            .then(res => res.json())
            .then(json => {
                this.setState({
                    metadata: json
                });
            });
        });
    }

    addFiles(Newfiles) {        
        let filteredFileURLs = Array.from(Newfiles).filter(file => file.type.includes("audio"))
            .map(file => (window.URL || window.webkitURL).createObjectURL(file))
        // Temporarily nstore the file urls
        this.fileURLs = this.fileURLs.concat(filteredFileURLs)
    }
    //For debugging purposes
    getSnapshotBeforeUpdate() {
        console.log("Before update")
        return null
    }

    saveFiles() {

        // 1. check if we have enough storage space using something like fetch('projects/enoughspace/') (returns true or false)
        // proj1 (current proj) 10MB, proj 2 150MB, proj 3 40MB
        // currently, newproj1 30MB
        // fetch(enoughspace) --> proj2 + proj3 + newproj1--> 200MB
        // 2. if there is enough storage, do something like fetch('project/deleteallfilesinproject') (no files in current project)
        // 3. reupload all the files to the db using MainContainer.Save(data)

        // Check here if the project token is valid.

        const reque = {
            method: 'GET',
            headers: {
                'authorization': localStorage.usertoken,
                'projmetadata': localStorage.poname,
                'projectinfo' : localStorage.getItem('projecttoken') ? localStorage.projecttoken : ""
            }
        }

        fetch('/projects/updateaccess', reque)
        .then(data => 
            data.body.getReader())
        .then(reader => reader.read())
        .then(data => {
            const message = new TextDecoder("utf-8").decode(data.value);

            if(message === "Token does not match!") return new Error(message);

            localStorage.setItem('projecttoken', message);
            console.log("token updated");

            const blobs = this.audioStack.record();

            let sum = 0;
            let files = []
            blobs.forEach((blob, i) => {
                if ( localStorage.usertoken && localStorage.poname) {
                    const file = new File([blob.file], i + ".mp3", {type: "audio/mpeg"});
                    files.push(file)
                    sum += file.size;
                } else {
                    console.log("NOT LOGGED IN");
                }
            });

            const requestOptions = {
                method: 'GET',
                headers: { 
                    'Authorization': localStorage.usertoken,
                    'ProjMetadata': localStorage.poname
                }
            };

            fetch('/projects/enoughspace', requestOptions)
            .then(data => 
                data.body.getReader())
            .then(reader => reader.read())
            .then(data => {
                const message = new TextDecoder("utf-8").decode(data.value)
                if(parseInt(message) + sum <= 209715200) {
                    // delete all files in proj here
                    fetch('/projects/deleteall', requestOptions).then( () => {
                        // reupload all files to db here
                        files.forEach( (file, i) => {
                            let data = new FormData();
                            data.append('file', file);
                            // data.append('edits', 'abc134');
                            console.log("Attempting to save blob")
                            MainContainer.Save(data, blobs[i].stack, this.state.metadata)
                            .then(data => 
                                data.body.getReader())
                            .then(reader => reader.read())
                            .then(data => {
                                const message = new TextDecoder("utf-8").decode(data.value)
                                alert(message)
                            }).catch(err => console.log(err));
                        });
                    });
                } else {
                    console.log("Not enough space!");
                }
            }).catch(err => console.log(err));
        }).catch((err) => {
            alert(err);
        });
    }

    deleteCb(message) {
        console.log("CALLING FROM CONTAINER MESSAGE: ", message)
        this.audioStack.delete(message)
        this.state.audioRecords.forEach((ar, idx) => {
            if(ar.fileURL === message) {
                let tempArr = this.state.audioRecords
                tempArr.splice(idx, 1)
                this.setState({
                    audioRecords: tempArr
                })
            }
        })
    }

    uploadFiles() {
        this.fileURLs.forEach(fileURL => {
            console.log("URL: ", fileURL)
            MainContainer.UploadHandler(fileURL)
            .then(audioRecord => {
                // Process inside the audioStack
                // MUST COME BEFORE THE STATE CHANGE!
                this.audioStack.add(audioRecord, (msg) => this.deleteCb(msg))
                this.setState({
                    audioRecords: [...this.state.audioRecords, audioRecord]
                })               
            }).then(() => {
                console.log("Audio stack tracks: ", this.audioStack.tracks);
                // Empty the fileURLs since they have already been processed
                this.fileURLs = [];
            })
        })
    }
    
    playAll(){
        this.audioStack.play();
    }

    updateMetadata() {
        const title = document.getElementById("met-title").value;
        const artist = document.getElementById("met-artist").value;
        const album = document.getElementById("met-album").value;
        const year = document.getElementById("met-year").value;
        const track = document.getElementById("met-track").value;
        const genre = document.getElementById("met-genre").value;
        const comment = document.getElementById("met-comment").value;
        this.setState({
            metadata: {
                title: title,
                artist: artist,
                album: album,
                year: year,
                track: track,
                genre: genre,
                comment: comment
            }
        });
    }

    render() {
        return (
            <div className="row main">
                <Form className="col-12">
                    <Form.Group>
                        <Form.File 
                            required
                            name="file"
                            label="File"
                            multiple="multiple"
                            onChange={e => this.addFiles(e.target.files)}
                        />
                    </Form.Group>
                    <Button onClick={this.uploadFiles} variant="outline-primary">Upload</Button>
                    <Button onClick={this.saveFiles} variant="outline-primary">Save</Button>
                    <Button onClick={this.playAll} variant="success">Play/Pause All</Button>
                    <MetadataModal variant={"info"} name={"Metadata"} metadata={this.state.metadata} handler={this.updateMetadata}/>
                    <ShareLinkModal inf={localStorage.getItem('poname')} name={"Share"} variant={"warning"}/>
                </Form>
                <div className="col-12">
                    {this.audioStack.tracks}
                </div>
            </div>
        );
    }
}

/* 
    Returns a promise containing important data surrounding the uploaded file.
    This data is used for all operations surrounding audio file management.
*/

MainContainer.UploadHandler = (fileURL) => {
    return (
        new Promise((resolve) => {
            fetch(fileURL).then(res => res.blob()).then(blob => {
                addUpload(fileURL, blob, resolve);
            }).catch(err => console.log(err, "Error with fetch @, ", fileURL));
        })
    );
}

MainContainer.Save = (obj, stack, met) => {
    const requestOptions = {
        method: 'POST',
        headers: { 
            'Authorization': localStorage.usertoken,
            'ProjMetadata': localStorage.poname,
            'Stack' : JSON.stringify(stack),
            'FinalMetadata': JSON.stringify(met)
        },
        // body: JSON.stringify(obj)
        body: obj
    };
    
    return Promise.resolve(fetch('/projects/save', requestOptions))
};

export function MetadataModal(props) {
    const [show, setShow] = React.useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true); 
    return (
    <>
        <Button variant={props.variant} onClick={handleShow}>{props.name}</Button>
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Metadata</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <InputGroup>
                    <InputGroup.Prepend>
                        <InputGroup.Text id="inputGroup-sizing-default">Title</InputGroup.Text>
                    </InputGroup.Prepend>
                    <FormControl id="met-title" aria-label="Default" aria-describedby="inputGroup-sizing-default" defaultValue={props.metadata.title}/>
                </InputGroup>
                <InputGroup>
                    <InputGroup.Prepend>
                        <InputGroup.Text id="inputGroup-sizing-default">Artist</InputGroup.Text>
                    </InputGroup.Prepend>
                    <FormControl id="met-artist" aria-label="Default" aria-describedby="inputGroup-sizing-default" defaultValue={props.metadata.artist}/>
                </InputGroup>
                <InputGroup>
                    <InputGroup.Prepend>
                        <InputGroup.Text id="inputGroup-sizing-default">Album</InputGroup.Text>
                    </InputGroup.Prepend>
                    <FormControl id="met-album" aria-label="Default" aria-describedby="inputGroup-sizing-default" defaultValue={props.metadata.album}/>
                </InputGroup>
                <InputGroup>
                    <InputGroup.Prepend>
                        <InputGroup.Text id="inputGroup-sizing-default">Year</InputGroup.Text>
                    </InputGroup.Prepend>
                    <FormControl id="met-year" aria-label="Default" aria-describedby="inputGroup-sizing-default" defaultValue={props.metadata.year}/>
                </InputGroup>
                <InputGroup>
                    <InputGroup.Prepend>
                        <InputGroup.Text id="inputGroup-sizing-default">Track</InputGroup.Text>
                    </InputGroup.Prepend>
                    <FormControl id="met-track" aria-label="Default" aria-describedby="inputGroup-sizing-default" defaultValue={props.metadata.track}/>
                </InputGroup>
                <InputGroup>
                    <InputGroup.Prepend>
                        <InputGroup.Text id="inputGroup-sizing-default">Genre</InputGroup.Text>
                    </InputGroup.Prepend>
                    <FormControl id="met-genre" aria-label="Default" aria-describedby="inputGroup-sizing-default" defaultValue={props.metadata.genre}/>
                </InputGroup>
                <InputGroup>
                    <InputGroup.Prepend>
                        <InputGroup.Text id="inputGroup-sizing-default">Comment</InputGroup.Text>
                    </InputGroup.Prepend>
                    <FormControl id="met-comment" aria-label="Default" aria-describedby="inputGroup-sizing-default" defaultValue={props.metadata.genre}/>
                </InputGroup> 
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
                Cancel
            </Button>
            <Button variant="success" onClick={props.handler}>
                Save
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
    console.log("SHARE: ", inf)
    if(!inf || !inf.str || !inf.owner || !inf.name) {
        return <></>
    }
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