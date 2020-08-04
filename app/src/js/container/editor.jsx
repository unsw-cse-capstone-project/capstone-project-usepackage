import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import AudioStack from '../audioContainer/audioStack'
import Modal from 'react-bootstrap/Modal'
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import { fetchGet, fetchPost, fetchGetJSON } from '../extramodules/custfetch';
import { BsInfoCircleFill, BsCollectionPlayFill } from 'react-icons/bs'
import { MdFileUpload, MdFileDownload, MdShare, MdSave, MdUndo, MdRedo } from 'react-icons/md'
import Hotkeys from '../BasicComponents/Hotkeys.jsx';
import lamejs from '../lib/lamejs.js';
import WavAudioEncoder from '../lib/WavAudioEncoder';

const OggVorbisEncoder = window.OggVorbisEncoder;

// const dbURL = "http://localhost:8080"

/**
 * editor.jsx
 * This is the primary EditorUI.
 * The UI comprised of global and track-individual componenets.
 * the global component primarily deals with uploading/downloading/saving projects
 * the track-individual components deal with editing/playing/pausing each of the individual tracks
 */

 /**
  * addUpload will pass an audio file to an audio context.
  * It needs the file url and blob in order for this to work. 
  */
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
        this.undoHandler = this.undoHandler.bind(this);
        this.redoHandler = this.redoHandler.bind(this);
        if (localStorage.usertoken && localStorage.poname) {
            window.onbeforeunload = () => {
                return "Please make sure that you saved your project before leaving!"
            }
            this.loadFiles();
        }
    }

    // opts is merely an extra basic field for a requestoption for most of the routings. 
    opts() {
        return {
            'projmetadata': localStorage.poname,
            'projectinfo' : localStorage.getItem('projecttoken') ? localStorage.projecttoken : ""
        }
    }


    // Assuming a project is loaded, the UI will attempt to load audio files for a given project. 
    loadFiles() {
        // CHECK HERE IF USER CAN ACCESS PROJECT using /projects/attemptaccess
        // fetch('/projects/updateaccess', ...) ==> 

        // Before anything authroise user
        fetchGet('/projects/attemptaccess', this.opts())
        .then(message => {
            if(message === "Cannot allocate session!" || message === "Forbidden") return new Error(message);
            localStorage.setItem('projecttoken', message);

            // once authorised, poll the projecttoken so that it is updated every 30 seconds. 
            setInterval(() => {
                fetchGet('/projects/updateaccess', this.opts()).then(message => {
                    if(message === "Token does not match!") return new Error("Token does not match!");
                    localStorage.setItem('projecttoken', message);
                }).catch(err => console.log(err));
            }, 30 * 1000);

            // next we obtain how many audio files we need to retrieve from the database 
            let len = 0;
            fetchGet('/projects/numfiles', this.opts())
            .then(message => {
                if(message === "fail") console.log(message);
                // console.log(message);
                len = parseInt(message);
                // here, we obtained the number of audio files. 
                // load each audio file one by one. 
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
                            // once a file was retrieved, upload this file.
                            addUpload(URL.createObjectURL(blob), blob, resolve);
                        });
                    }).then((audioRecord) => {
                        fetchGet('projects/getstack', {
                                'projmetadata': localStorage.poname,
                                'nth': i
                        }).then(message => {
                            // next, we obtain the edit history of the said audio file
                            const stackjson = JSON.parse(message);
                            return {audioRecord: audioRecord, stack: stackjson}
                        }).then(record => {
                            // Process inside the audioStack
                            // MUST COME BEFORE THE STATE CHANGE!
                            // we add the overall track to the audio stack 
                            this.audioStack.add(record.audioRecord, (msg) => this.deleteCb(msg), record.stack ) 
                            this.setState({
                                audioRecords: [...this.state.audioRecords, record.audioRecord]
                            })               
                        }).then(() => {
                            console.log("Audio stack tracks: ", this.audioStack.tracks);
                            // Empty the fileURLs since they have already been processed
                            this.fileURLs = [];
                        }).catch(err => {
                            console.log(err);
                        });
                    })
                }
            }).catch( (err) => {
                alert(err);
                localStorage.removeItem('poname');
                localStorage.removeItem('projecttoken');
                const a = document.createElement('a');
                a.href = "/profile";
                a.hidden = true;
                document.body.appendChild(a);
                a.click();
            });
            // Afterwards, get project metadata
            fetchGetJSON('projects/getmetadata', {
                    'projmetadata': localStorage.poname
            }).then(json => {
                this.setState({
                    metadata: json
                });
            });
        });
    }

    radioHandler(e) {
        this.setState({downloadType: e.target.value})
    }

    /**
     * Download handler
     * Responsible for downloading the entire edited merged audio file. 
     */
    downloadHandler() {
        console.log("downloading...", this.state.downloadType)
        // first, record all the audio files into the desired format
        this.audioStack.record(this.state.downloadType).then(buffers => {
            buffers = buffers[0];
            const max = buffers.reduce((p, n) => Math.max(p, n.length), 0);
            const num = buffers.length;
            const buffer = (new AudioContext()).createBuffer(2, max, buffers[0].sampleRate);
            const channels = [
                buffer.getChannelData(0),
                buffer.getChannelData(1)
            ];
            for (let i = 0; i < num; i++) {
                const n = buffers[i].numberOfChannels < 2 ? 0 : 1;
                const buffChan = [
                    buffers[i].getChannelData(0),
                    buffers[i].getChannelData(n)
                ];
                for (let j = 0; j < buffers[i].length; j++) {
                    channels[0][j] += buffChan[0][j] / num;
                    channels[1][j] += buffChan[1][j] / num;
                }
            }
            // at this point, we have have recorded all the audio files. We now need to encode the files. 
            let encoder = null;
            switch (this.state.downloadType) {
                case "mp3":
                    {
                        encoder = new lamejs.Mp3Encoder(2, buffer.sampleRate, 128);
                        let mp3Data = [];
                        let mp3buf;
                        const sampleBlockSize = 576;

                        function FloatArray2Int16(floatbuffer) {
                            var int16Buffer = new Int16Array(floatbuffer.length);
                            for (var i = 0, len = floatbuffer.length; i < len; i++) {
                                if (floatbuffer[i] < 0) {
                                    int16Buffer[i] = 0x8000 * floatbuffer[i];
                                } else {
                                    int16Buffer[i] = 0x7FFF * floatbuffer[i];
                                }
                            }
                            return int16Buffer;
                        }
                        const left = FloatArray2Int16(buffer.getChannelData(0));
                        const right = FloatArray2Int16(buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : buffer.getChannelData(0));
                        for (let i = 0; i < buffer.length; i += sampleBlockSize) {
                            let leftChunk = left.subarray(i, i + sampleBlockSize);
                            let rightChunk = right.subarray(i, i + sampleBlockSize);
                            mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
                            if (mp3buf.length > 0) {
                                mp3Data.push(mp3buf);
                            }
                        }
                        mp3buf = encoder.flush();
                        if (mp3buf.length > 0)
                            mp3Data.push(mp3buf);
                        return new Blob(mp3Data, { type: 'audio/mp3' });
                    }

                case "ogg":
                    {
                        function getBuffers(event) {
                            var buffers = [];
                            for (var ch = 0; ch < 2; ++ch)
                                buffers[ch] = event.inputBuffer.getChannelData(ch);
                            return buffers;
                        }
                        let newCon = new OfflineAudioContext(2, buffer.length, buffer.sampleRate);
                        let encoder = new OggVorbisEncoder(buffer.sampleRate, 2, 1); // not a constructor
                        let input = newCon.createBufferSource();
                        input.buffer = buffer;
                        let processor = newCon.createScriptProcessor(2048, 2, 2);
                        input.connect(processor);
                        processor.connect(newCon.destination);
                        processor.onaudioprocess = function(event) {
                            encoder.encode(getBuffers(event));
                        };
                        input.start();
                        return newCon.startRendering().then(() => {
                            return encoder.finish();
                        });
                    }

                case "wav":
                    {
                        const encode = new WavAudioEncoder(buffer.sampleRate, 2); // WavAudioEncoder is not defined
                        encode.encode([buffer.getChannelData(0), buffer.getChannelData(1)]);
                        const blob = encode.finish();
                        console.log(blob);
                        return blob;
                    }
            }
        }).then((blob) => {
            // afterwards, trigger a download. 
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download="audio." + this.state.downloadType
            a.hidden = true;
            document.body.appendChild(a);
            a.click();
        });
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

    /**
     * saveFiles()
     * saves the entire state of the audio project to the database. 
     */
    saveFiles() {

        // first check if you are authorised to save
        fetchGet('/projects/updateaccess', this.opts())
        .then(message => {
            if(message === "Token does not match!" || message === "Forbidden") return new Error(message);
            localStorage.setItem('projecttoken', message);
            // then, encode all audio files to mp3 format.
            this.audioStack.record("mp3x").then(blobs => {
                let sum = 0;
                let files = []
                blobs[0].forEach((blob, i) => {
                    if ( localStorage.usertoken && localStorage.poname) {
                        const file = new File([blob], i + ".mp3", {type: "audio/mpeg"});
                        files.push(file)
                        sum += file.size;
                    } else {
                        console.error("NOT LOGGED IN");
                    }
                });
                const opts = { 
                    'authorization': localStorage.usertoken,
                    'projmetadata': localStorage.poname
                }
                // before uploading each encoded audio file, check if there is enough space to upload
                fetchGet('/projects/enoughspace', this.opts())
                .then(message => {
                    // 209715200 is 200MB
                    if(parseInt(message) + sum <= 209715200) {
                        // delete all files in proj here
                        fetchGet('/projects/deleteall', this.opts()).then( () => {
                            // reupload all files to db here
                            files.forEach((file, i) => {
                                let data = new FormData();
                                data.append('file', file);
                                const opts = 
                                {
                                    'projmetadata': localStorage.poname,
                                    'stack' : JSON.stringify(blobs[1][i]),
                                    'FinalMetadata': JSON.stringify(this.state.metadata)
                                } 
                                console.log("OPTS: ", blobs[1][i])
                                // everything is all good. Proceed with saving the file to the database. 
                                fetchPost('/projects/save', opts, data).then(message => {
                                    alert(message)
                                }).catch(err => console.log(err));
                            });
                        });
                    } else {
                        console.log("Not enough space!");
                    }
                });
            }).catch(err => console.log(err));
        }).catch((err) => {
            alert(err);
        });
    }

    // attempts to delete from audioRecords
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

    // uploads one audio file to the database. 
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
    
    // plays all audio files in the project
    playAll(){
        this.audioStack.play();
    }

    // update the metadata of the project locally. 
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

    // render the save button. only visible if a project session is set. 
    drawSaveButton() {
        if(localStorage.getItem('usertoken') && localStorage.getItem('poname'))
            return <Button className="btn-margin btn-save" onClick={this.saveFiles}><MdSave /></Button>
    }
    
    // undo action globally
    undoHandler(){
        this.audioStack.undo();
    }
    
    // redo action globally
    redoHandler(){
        this.audioStack.redo();
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
                    <Button className="btn-margin" onClick={this.undoHandler} variant="warning"><MdUndo /></Button>
                    <Button className="btn-margin" onClick={this.redoHandler} variant="success"><MdRedo /></Button>
                    <Hotkeys undoHandler={this.undoHandler} redohandler={this.redoHandler} spacehandler={this.playAll}/>
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
// upload audio file to gridFS
MainContainer.UploadHandler = (fileURL) => {
    return (
        new Promise((resolve) => {
            fetch(fileURL).then(res => res.blob()).then(blob => {
                addUpload(fileURL, blob, resolve);
            }).catch(err => console.log(err, "Error with fetch @, ", fileURL));
        })
    );
}

// save project file
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

// metadatal modal. 
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

//download modal. 
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