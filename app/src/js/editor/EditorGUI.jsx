
import React from 'react';
import PropTypes from 'prop-types';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import FormControl from 'react-bootstrap/FormControl';
import UploadHandler from './UploadHandler.jsx';
import { runCommand } from '../converter/converter.js'; 
import AudioStack from './AudioStack.jsx';
import Form from 'react-bootstrap/Form';

export default class EditorGUI extends React.Component {
    constructor(props) {
        super(props);
        this.uploadHandler = new UploadHandler();
        this.audioStack = null;
        this.record = null;
        this.state = {
            format: { 
                type: "MP3",
                channels: 2 
             }
        }
        this.uploadButtonHandler = this.uploadButtonHandler.bind(this);
        this.uploadFileHandler = this.uploadFileHandler.bind(this);
        this.formatHandler = this.formatHandler.bind(this);
        this.downloadHandler = this.downloadHandler.bind(this);
        this.testButton = this.testButton.bind(this);
    }

    uploadFileHandler(e) {
        this.uploadHandler.handleChange(Array.from(e.target.files)).then((result) => {
            for (let file of result) {
                this.audioStack(file);
            }
            // this.setState({
            //     files: result,
            //     visualisers: result.map((e, i) => [
            //             <div key={2*i} className="col-10">
            //                 <FreqVisualiser width={300} height={100} key={4 * i} analyser={result[i].analyser[0]}/>
            //                 <FreqVisualiser width={300} height={100} key={4 * i + 1} analyser={result[i].analyser[1]}/>
            //             </div>,
            //             <div key={2*i + 1} className="col-10">
            //                 <TimeVisualiser width={300} height={100} key={4 * i + 2} analyser={result[i].analyser[0]}/>
            //                 <TimeVisualiser width={300} height={100} key={4 * i + 3} analyser={result[i].analyser[1]}/> 
            //             </div>
            //         ]
            //     )
            // });
        }).catch( err => {console.log(err);});
    }

    uploadButtonHandler() {
        const fileInput = document.getElementById("UploadButton");
        fileInput.click();
    }
    
    testButton() {
        // implement test here using runCommand(input, output)
        const createFileObjs = this.state.files.map(i => {
            return {
                "name": i.fileName,
                "data": new Uint8Array(i.arrayBuffer)
            }
        });
        // currently returns errno 17: file exists
        runCommand(createFileObjs, "output_test_2.mp3"); // [{}, {}]
    }

    formatHandler(target) {
        if (target.name == "format")
            this.setState({
                format: {
                    type: target.dataset.label,
                    channels: this.state.format.channels
                }
            });
        else
            this.setState({
                format: {
                    type: this.state.format.type,
                    channels: parseInt(target.dataset.label)
                }
            });
    }
    
    downloadHandler() {
        console.log("Downloading file of type: ", this.state.format);
        this.record(this.state.format.type, this.state.format.channels).then((blob) => {
            console.log("Done!");
            let a = document.createElement('a');
            a.download = 'test.' + this.state.format.type.toLowerCase();
            a.href = URL.createObjectURL(blob);
            a.innerText = "Download Link!";
            a.hidden = true;
            document.body.appendChild(a);
            a.click();
        });
    }

    render() {
        return (
            <main className="col-md-9 ml-sm-auto col-lg-10 pt-3 px-4">
                <h1>{this.props.title}</h1>
                <div className="row">
                <div className="col-6">
                    <UploadForm uploadButtonHandler={this.uploadButtonHandler} uploadFileHandler={this.uploadFileHandler} />
                </div>
                <div className="col-6">
                    <Form>
                        <Form.Group>
                            <Form.Label as="legend" column sm={5}>
                                Download File Formats
                            </Form.Label>
                            <div className="row">
                            <div className="col">
                            <Form.Check onChange={(e) => this.formatHandler(e.target)} type="radio" label="MP3" data-label="MP3" id="MP3-rad" name="format" defaultChecked />
                            </div>
                            <div className="col">
                            <Form.Check onChange={(e) => this.formatHandler(e.target)} type="radio" label="Mono" data-label={1} id="Mono-rad" name="SM" />
                            </div>
                            </div>
                            <div className="row">
                            <div className="col">
                            <Form.Check onChange={(e) => this.formatHandler(e.target)} type="radio" label="WAV" data-label="WAV" id="WAV-rad" name="format" />
                            </div>
                            <div className="col">
                            <Form.Check onChange={(e) => this.formatHandler(e.target)} type="radio" label="Stereo" data-label={2} id="Stereo-rad" name="SM" defaultChecked />
                            </div>
                            </div>
                            <div className= "row">
                            <div className="col">
                            <Form.Check onChange={(e) => this.formatHandler(e.target)} type="radio" label="OGG" data-label="OGG" id="OGG-rad" name="format" />            
                            </div>
                            </div>
                        </Form.Group>
                        <Button onClick={this.downloadHandler} id="downloadButton">Download</Button>
                    </Form>
                </div>
                <AudioStack onMounted={(f, r) => {this.audioStack = f; this.record = r;}} />
                </div>
            </main>
        );
    }
}

const UploadForm = (props) => {
    return (    
    <InputGroup>
        <FormControl
            className="inputStyle"
            id="UploadButton"
            onChange={props.uploadFileHandler}
            placeholder="Upload File"
            aria-label="Upload File"
            type="file"
            multiple
        />
        <Button onClick={props.uploadButtonHandler} variant="outline-secondary">Upload</Button>
    </InputGroup>
    );
}

UploadForm.propTypes = {
    uploadFileHandler: PropTypes.func,
    uploadButtonHandler: PropTypes.func
}

EditorGUI.propTypes = {
    title: PropTypes.string
}
