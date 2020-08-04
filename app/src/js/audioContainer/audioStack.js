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

    // Adds a new audio track to the stack. Requires initialising callback functions and maps
    add(audioRecord, deleteCb, stack=[]) {
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
    }

    // Deletes a track, removing it from the necessary arrays
    delete(Containerkey) {
        let index = -1;
        this.tracks.forEach((track, idx) => {
            if (track.key === Containerkey) {
                index = idx;
                this.tracks.splice(index, 1);
                this.records.splice(index, 1);
                this.toggles.splice(index, 1);
                return;
            }
        })
        
    }

    // Stores the audio tracks together, either for downloading or saving
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

    // Returns the tracks for rendering purposes in editor
    tracks() {
        return this.tracks
    }

    // Called from editor, calls the play/pause toggle function in each of the audioTrackContainers stored here
    play() {
        this.toggles.forEach((toggle) => {
            toggle();
        })
    }

    // Undoes the action done in the most recently changed track
    undo(){
        const key = this.undoStack.pop();
        this.redoStack.push(key);
        this.undoMap.get(key)();
    }
    
    // Redos the action most recently done in the most recently undone track
    redo(){
        const key = this.redoStack.pop();
        this.undoStack.push(key);
        this.redoMap.get(key)();
    }

    // Most recently changed track notifying the stack that it's being changed
    receiveAction(key){
        this.redoStack = [];
        this.undoStack.push(key);
    }
}