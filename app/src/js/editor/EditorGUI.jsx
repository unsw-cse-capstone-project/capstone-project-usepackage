import React from 'react';
import PropTypes from 'prop-types';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import FormControl from 'react-bootstrap/FormControl';
import UploadHandler from './UploadHandler.jsx'
import TimeVisualiser from './TimeVisualiser.jsx'
import GainController from './controller/GainController.jsx'


export default class EditorGUI extends React.Component {
    constructor(props) {
        super(props);
        this.uploadHandler = new UploadHandler();
        this.state = {
            files: [],
            visualisers: []
        };
        this.uploadButtonHandler = this.uploadButtonHandler.bind(this);
        this.uploadFileHandler = this.uploadFileHandler.bind(this);
    }

    uploadFileHandler(e) {
        this.uploadHandler.handleChange(Array.from(e.target.files)).then((result) => {
            this.setState({
                files: result,
                visualisers: result.map((e, i) => [
                        <TimeVisualiser width={500} height={100} key={2 * i} analyser={result[i].analyser[0]}/>,
                        <TimeVisualiser width={500} height={100} key={2 * i + 1} analyser={result[i].analyser[1]}/>
                    ]
                )
            });
        }).catch( err => {console.log(err);});
    }

    uploadButtonHandler() {
        const fileInput = document.getElementById("UploadButton");
        fileInput.click();
    }
    
    render() {
        return (
            <main className="col-md-9 ml-sm-auto col-lg-10 pt-3 px-4">
                <h1>{this.props.title}</h1>
                <div className="col-7">
                    <UploadForm uploadButtonHandler={this.uploadButtonHandler} uploadFileHandler={this.uploadFileHandler} />
                    <PlayButton handler={this.playBuffer} />
                    <StopButton handler={this.stopBuffer} />
                    <GainController min={0} max={2} step={0.01} handler={(e) => this.gainHandler(e, 0)} />
                    <GainController min={0} max={2} step={0.01} handler={(e) => this.gainHandler(e, 1)} />
                </div>
                {this.state.visualisers}
            </main>
        );
    }
}