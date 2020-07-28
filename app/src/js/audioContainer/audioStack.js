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
        this.add = this.add.bind(this)
        this.record = this.record.bind(this)
    }

    add(audioRecord, deleteCb) {
        console.log("DeleteCB: ", deleteCb)
        this.tracks.push( < AudioTrackContainer key = { audioRecord.fileURL }
            audioRecord = { audioRecord } deleteCb = { deleteCb }
            onMounted = { f => { this.records[this.records.length] = f } }
            /> );
    }

    delete(Containerkey) {
        let index = -1;
        this.tracks.forEach((track, idx) => {
            if ( track.key === Containerkey ) {
                index = idx;
                this.tracks.splice(index, 1);
                this.records.splice(index, 1);
                return;
            }
        })
    }

    record() {
        let blobs = []
        this.tracks.forEach((_, i) => {
            blobs.push(this.records[i]())
        })
        return blobs
    }

    tracks() {
        return this.tracks
    }

}