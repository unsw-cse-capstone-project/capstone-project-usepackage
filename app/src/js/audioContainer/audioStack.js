/* 
    The audio stack has a list of audio tracks within it.
    It holds components universal to all tracks
*/

import React from 'react'
import AudioTrackContainer from './audioTrackContainer.jsx'

export default class AudioStack {

    constructor() {
        this.tracks = []
        this.add = this.add.bind(this)
    }

    add(audioRecord) {
        this.tracks.push(<AudioTrackContainer key={audioRecord.fileURL} audioRecord={audioRecord}/> );
    }

    tracks() {
        return this.tracks
    }

}