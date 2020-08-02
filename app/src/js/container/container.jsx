import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import AudioStack from '../audioContainer/audioStack'
import Modal from 'react-bootstrap/Modal'
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import { fetchGet, fetchPost, fetchGetJSON } from '../extramodules/custfetch';
import { BsInfoCircleFill, BsCollectionPlayFill } from 'react-icons/bs'
import { MdFileUpload, MdFileDownload, MdShare, MdSave } from 'react-icons/md'

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
            },
            downloadType: "mp3"
        }
        this.fileURLs = []
        this.addFiles = this.addFiles.bind(this);
        this.saveFiles = this.saveFiles.bind(this);
        this.uploadFiles = this.uploadFiles.bind(this);
        this.playAll = this.playAll.bind(this);
        this.loadFiles = this.loadFiles.bind(this);
        this.deleteCb = this.deleteCb.bind(this);
        this.updateMetadata = this.updateMetadata.bind(this);
        this.opts = this.opts.bind(this);
        this.radioHandler = this.radioHandler.bind(this);
        this.downloadHandler = this.downloadHandler.bind(this);
        if (localStorage.usertoken && localStorage.poname) {
            window.onbeforeunload = () => {
                return "Please make sure that you saved your project before leaving!"
            }
            this.loadFiles();
        }
    }

    opts() {
        return {
            'projmetadata': localStorage.poname,
            'projectinfo' : localStorage.getItem('projecttoken') ? localStorage.projecttoken : ""
        }
    }

    loadFiles() {
        // CHECK HERE IF USER CAN ACCESS PROJECT using /projects/attemptaccess
        // fetch('/projects/updateaccess', ...) ==> 

        fetchGet('/projects/attemptaccess', this.opts())
        .then(message => {
            console.log(message);
            if(message === "Cannot allocate session!" || message === "Forbidden") return new Error(message);
            localStorage.setItem('projecttoken', message);
            console.log("obtaining number of files info");

            setInterval(() => {
                fetchGet('/projects/updateaccess', this.opts()).then(message => {
                    if(message === "Token does not match!") return new Error("Token does not match!");
                    localStorage.setItem('projecttoken', message);
                    console.log("token updated");
                }).catch(err => console.log(err));
            }, 10 * 1000);

            let len = 0;
            fetchGet('/projects/numfiles', this.opts())
            .then(message => {
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
                            'projmetadata': localStorage.poname,
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
                        fetchGet('projects/getstack', {
                                'projmetadata': localStorage.poname,
                                'nth': i
                            }
                        ).then(message => {
                            console.log("STACK!!! ", message)})
                    }).catch(err => {
                        console.log(err);
                    });
                }
            }).catch(err => console.log(err));
            fetchGetJSON('projects/getmetadata', {
                    'projmetadata': localStorage.poname
                }
            ).then(json => {
                this.setState({
                    metadata: json
                });
            });
        });
    }

    radioHandler(e) {
        this.setState({downloadType: e.target.value})
    }

    downloadHandler() {
        console.log("downloading...", this.state.downloadType)
        let blobs = this.audioStack.record(this.state.downloadType);
        console.log(blobs);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blobs[0].file);
        a.download="test." + this.state.downloadType
        a.hidden = true;
        document.body.appendChild(a);
        a.click();
    }

    addFiles(Newfiles) {        
        let filteredFileURLs = Array.from(Newfiles).filter(file => file.type.includes("audio"))
            .map(file => (window.URL || window.webkitURL).createObjectURL(file))
        this.fileURLs = this.fileURLs.concat(filteredFileURLs)
    }
    getSnapshotBeforeUpdate() {
        console.log("Before update")
        return null
    }

    saveFiles() {
        // opts = {
        //     'projmetadata': localStorage.poname,
        //     'projectinfo' : localStorage.getItem('projecttoken') ? localStorage.projecttoken : ""
        // }

        fetchGet('/projects/updateaccess', this.opts())
        .then(message => {
            if(message === "Token does not match!" || message === "Forbidden") return new Error(message);
            localStorage.setItem('projecttoken', message);
            console.log("token updated");

            const blobs = this.audioStack.record("mp3");

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
            const opts = { 
                'authorization': localStorage.usertoken,
                'projmetadata': localStorage.poname
            }

            fetchGet('/projects/enoughspace', this.opts())
            .then(message => {
                if(parseInt(message) + sum <= 209715200) {
                    // delete all files in proj here
                    fetchGet('/projects/deleteall', this.opts()).then( () => {
                        // reupload all files to db here
                        files.forEach( (file, i) => {
                            let data = new FormData();
                            data.append('file', file);
                            // data.append('edits', 'abc134');
                            console.log("Attempting to save blob")
                            const opts = 
                            {
                                'projmetadata': localStorage.poname,
                                'stack' : JSON.stringify(blobs[i].stack),
                                'FinalMetadata': JSON.stringify(this.state.metadata)
                            } 
                            fetchPost('/projects/save', opts, data).then(message => {
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
                this.audioStack.add(audioRecord, (msg) => this.deleteCb(msg))
                this.setState({
                    audioRecords: [...this.state.audioRecords, audioRecord]
                })               
            }).then(() => {
                console.log("Audio stack tracks: ", this.audioStack.tracks);
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

    drawSaveButton() {
        if(localStorage.getItem('usertoken') && localStorage.getItem('poname'))
            return <Button className="btn-margin btn-save" onClick={this.saveFiles}><MdSave /></Button>
    }

    render() {
        const projHeader = localStorage.getItem('poname') ? JSON.parse(localStorage.poname).name : "";
        return (
            <div className="row main">
                <h1>{projHeader}</h1>
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
                    <Button className="btn-margin" onClick={this.uploadFiles} variant="outline-primary"><MdFileUpload /></Button>
                    {this.drawSaveButton()}
                    <Button className="btn-margin" onClick={this.playAll} variant="success"><BsCollectionPlayFill /></Button>
                    <MetadataModal variant={"info"} name={"Metadata"} metadata={this.state.metadata} handler={this.updateMetadata}/>
                    <ShareLinkModal inf={localStorage.getItem('poname')} name={"Share"} variant={"warning"}/>
                    <DownLoadModel name={"Download"} defaultState={this.state.downloadType} radioHandler={this.radioHandler} handler={this.downloadHandler}/>
                </Form>
                <div className="">
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
            'authorization': localStorage.usertoken,
            'projmetadata': localStorage.poname,
            'stack' : JSON.stringify(stack),
            'FinalMetadata': JSON.stringify(met)
        },
        body: obj
    };
    
    return Promise.resolve(fetch('/projects/save', requestOptions))
};

export function MetadataModal(props) {
    const [show, setShow] = React.useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true); 

    const headings = ["title", "artist", "album", "year", "track", "genre", "comment"]
    const objs = headings.map((item, i) => {
        return (
        <InputGroup key={i}>
            <InputGroup.Prepend>
                <InputGroup.Text id="inputGroup-sizing-default">{item[0].toUpperCase()+item.slice(1)}</InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl id={"met-"+item} 
                aria-label="Default" 
                aria-describedby="inputGroup-sizing-default" 
                defaultValue={props.metadata[item]}
            />
        </InputGroup>
        );
    })
    return (
    <>
        <Button className="btn-margin" variant={props.variant} onClick={handleShow}><BsInfoCircleFill /></Button>
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Metadata</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {objs}
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

export function DownLoadModel(props) {
    const [show, setShow] = React.useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true); 

    const headings = ["mp3", "ogg", "wav"]
    const objs = headings.map((item, i) => {
        return (
            <Form.Check type='radio' default={props.defaultState} value={item} label={item} id={`def-${item}`} name="dl" onChange={(e) => props.radioHandler(e)}/>
        );
    })
    return (
    <>
        <Button className="btn-margin" variant={props.variant} onClick={handleShow}><MdFileDownload /></Button>
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Download</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {objs}
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
                Cancel
            </Button>
            <Button variant="success" onClick={props.handler}>
                Download
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
        <Button className="btn-margin" variant={props.variant} onClick={handleShow}><MdShare /></Button>
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