/* 
    The audio stack has a list of audio tracks within it.
    It holds components universal to all tracks
*/

import React from 'react'
import AudioTrackContainer from './audioTrackContainer.jsx'

export default class AudioStack {

    constructor() {
        this.tracks = []
        this.records = []
        this.controllers = []
        this.toggles = []
        this.undoStack = []
        this.redoStack = []
        this.add = this.add.bind(this)
        this.record = this.record.bind(this)
        this.undo = this.undo.bind(this);
        this.redo = this.redo.bind(this);
        this.receiveAction = this.receiveAction.bind(this);
        this.undoMap = new Map();
        this.redoMap = new Map();
    }

    add(audioRecord, deleteCb, stack=[]) {
        // console.log("audioStack add: ", audioRecord.fileURL)
        this.tracks.push(< AudioTrackContainer key = { audioRecord.fileURL }
            skey = {audioRecord.fileURL}
            audioRecord = { audioRecord }
            deleteCb = { deleteCb }
            stack = {stack}
            onMounted = { f => { this.records[this.records.length] = f } }
            registerCB = { f => { this.toggles[this.toggles.length] = f } }
            undoCB = { f => { this.undoMap.set(audioRecord.fileURL, f)} }
            redoCB = { f => { this.redoMap.set(audioRecord.fileURL, f)} }
            transmitAction = { this.receiveAction }
            stackKey = {this.mapKeys}
        /> );
        console.log("Adding to map, new index:", this.records.length);
    }

    delete(Containerkey) {
        let index = -1;
        this.tracks.forEach((track, idx) => {
            if (track.key === Containerkey) {
                index = idx;
                this.tracks.splice(index, 1);
                this.records.splice(index, 1);
                // this.controllers.splice(index, 1);
                this.toggles.splice(index, 1);
                return;
            }
        })
        
    }

    record(type) {
        console.log("AUDIOSTACK TYPE: ", type) // DEBUG
        let rec = []
        let stack = []
        this.tracks.forEach((_, i) => {
            const recObj = this.records[i](type)
            // blobs.push({
            //     file: recObj.rec,
            //     stack: recObj.stack
            // })
            rec.push(recObj.rec)
            stack.push(recObj.stack)
        })
        return (new Promise((resolve) => {
            rec.reduce((prev, curr) => {
                return prev.then((val) => curr.then((val2) => [...val, val2]));
            }, Promise.resolve([])).then((recNew) => {
                stack.reduce((prev, curr) => {
                    return prev.then((val) => curr.then((val2) => [...val, val2]));
                }, Promise.resolve([])).then((stackNew) => {
                    resolve([recNew, stackNew]);
                });
            });
        }));
    }

    tracks() {
        return this.tracks
    }

    play() {
        this.toggles.forEach((toggle) => {
            toggle();
        })
    }

    undo(){
        const key = this.undoStack.pop();
        this.redoStack.push(key);
        console.log("undo function in undo:", this.undoMap.get(key));
        // console.log(this.undos[index]);
        this.undoMap.get(key)();
    }
    
    redo(){
        const key = this.redoStack.pop();
        this.undoStack.push(key);
        console.log("Key in redo:", key)
        console.log("redo function in redo:", this.redoMap.get(key));
        this.redoMap.get(key)();
    }

    receiveAction(key){
        this.redoStack = [];
        this.undoStack.push(key);
    }

}