
import React from 'react';
import PropTypes from 'prop-types';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import FormControl from 'react-bootstrap/FormControl';
import UploadHandler from './UploadHandler.jsx';
import { runCommand } from '../converter/converter.js'; 
import AudioStack from './AudioStack.jsx';

export default class EditorGUI extends React.Component {
    constructor(props) {
        super(props);
        this.uploadHandler = new UploadHandler();
        this.uploadButtonHandler = this.uploadButtonHandler.bind(this);
        this.uploadFileHandler = this.uploadFileHandler.bind(this);
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

    render() {
        return (
            <main className="col-md-9 ml-sm-auto col-lg-10 pt-3 px-4">
                <h1>{this.props.title}</h1>
                <div className="col-9">
                    <UploadForm uploadButtonHandler={this.uploadButtonHandler} uploadFileHandler={this.uploadFileHandler} />
                </div>
                <AudioStack onMounted={f => {this.audioStack = f;}} />
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
