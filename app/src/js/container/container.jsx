import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import AudioStack from '../audioContainer/audioStack'

export default class MainContainer extends React.Component {
    constructor(props) {
        super(props);
        this.audioStack = new AudioStack();
        this.state = {
            audioRecords: []
        }
        this.fileURLs = []
        this.addFiles = this.addFiles.bind(this);
        this.uploadFiles = this.uploadFiles.bind(this);
    }

    addFiles(Newfiles) {        
        let filteredFileURLs = Array.from(Newfiles).filter(file => file.type.includes("audio"))
            .map(file => (window.URL || window.webkitURL).createObjectURL(file))
        // Temporarily store the file urls
        this.fileURLs = this.fileURLs.concat(filteredFileURLs)
    }
    //For debugging purposes
    getSnapshotBeforeUpdate() {
        console.log("Before update")
        return null
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
            }).catch(err => console.log(err, "Error with fetch @, ", fileURL))
        })
    );
}
