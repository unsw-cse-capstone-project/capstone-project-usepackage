import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import AudioStack from '../audioContainer/audioStack'

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
            audioRecords: []
        }
        this.fileURLs = []
        this.addFiles = this.addFiles.bind(this);
        this.saveFiles = this.saveFiles.bind(this);
        this.uploadFiles = this.uploadFiles.bind(this);
        this.loadFiles = this.loadFiles.bind(this);
        if (localStorage.usertoken && localStorage.poname) {
            this.loadFiles();
        }
    }

    loadFiles() {
        console.log("obtaining number of files info");
        let len = 0;
        fetch('/projects/numfiles', {
            method: 'GET',
            headers: {
                'authorization': localStorage.usertoken,
                'ProjMetadata': localStorage.poname
            }
        })
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
                        addUpload(null, blob, resolve);
                    });
                }).then(audioRecord => {
                    // Process inside the audioStack
                    // MUST COME BEFORE THE STATE CHANGE!
                    this.audioStack.add(audioRecord) 
                    this.setState({
                        audioRecords: [...this.state.audioRecords, audioRecord]
                    })               
                }).then(() => {
                    console.log("Audio stack tracks: ", this.audioStack.tracks);
                    // Empty the fileURLs since they have already been processed
                    this.fileURLs = [];
                }).catch(err => {
                    console.log(err);
                });
            }
        }).catch(err => console.log(err));
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
        const blobs = this.audioStack.record();
        blobs.forEach( (blob, i) => {
            if ( blob.size > 100 && localStorage.usertoken && localStorage.poname) {
                // const URI = URL.createObjectURL(blobs[0])
                let data = new FormData();
                let file = new File([blob], i + ".mp3", {type: "audio/mpeg"});
                data.append('file', file);
                console.log("Attempting to save blob")
                MainContainer.Save(data)
                .then(data => 
                    data.body.getReader())
                .then(reader => reader.read())
                .then(data => {
                    const message = new TextDecoder("utf-8").decode(data.value)
                    alert(message)
                }).catch(err => console.log(err));
            } else {
                alert("NOT LOGGED IN")
            }
        });
        
        // localStorage.usertoken
        // let a = document.createElement('a');
        // a.download = 'test.mp3'
        // a.href = URL.createObjectURL(blob);
        // a.innerText = "Download Link!";
        // a.hidden = true;
        // document.body.appendChild(a);
        // a.click()
    }

    uploadFiles() {
        this.fileURLs.forEach(fileURL => {
            console.log("URL: ", fileURL)
            MainContainer.UploadHandler(fileURL)
            .then(audioRecord => {
                // Process inside the audioStack
                // MUST COME BEFORE THE STATE CHANGE!
                this.audioStack.add(audioRecord) 
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

MainContainer.Save = (obj) => {
    const requestOptions = {
        method: 'POST',
        headers: { 
            'Authorization': localStorage.usertoken,
            'ProjMetadata': localStorage.poname
        },
        // body: JSON.stringify(obj)
        body: obj
    };
    
    return Promise.resolve(fetch('/projects/save', requestOptions))
};
