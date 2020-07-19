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
        this.add = this.add.bind(this)
        this.record = this.record.bind(this)
    }

    add(audioRecord) {
        this.tracks.push( < AudioTrackContainer key = { audioRecord.fileURL }
            audioRecord = { audioRecord }
            onMounted = { f => { this.records[this.records.length] = f } }
            /> );
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