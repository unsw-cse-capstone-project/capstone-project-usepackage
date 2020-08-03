const mongoose = require('mongoose');
// const { random } = require('core-js/fn/number');
const Schema = mongoose.Schema;

// Schema for the project
const ProjectSchema = new Schema({
    // Name of the project
    name: {
        type: String,
        required: true
    },

    // The date the project was last modified
    date: {
        type: Date,
        default: Date.now()
    },

    // The ObjectId of the owner of the Project.
    // The ObjectId relates from User.js
    owner: {
        type: mongoose.Types.ObjectId,
        required: true
    },

    // ObjectIds of the collaborators of the Project
    // ObjectIds relate from User.js
    // Collaborators can edit the same project, but are given less privileges
    // They cannot create share links nor could they delete the project.
    // Owners are also given a higher priority. Collaborators will be
    // kicked out immediately once the owner edits the project.
    collaborators: {
        type: [mongoose.Types.ObjectId]
    },

    // List of audio files that are associated to the project.
    // Associated with each audio files are a stack, which shows
    // the current modified state of the audio file.
    // Users can also undo if the stack is not empty
    files: [{
        file_id: { type: mongoose.Types.ObjectId },
        stack: { type: String }
    }],

    // Tags used for categorising projects
    // When users filter their projects in the profile page,
    // it will be based on the truth value of each colour
    tags: {
        red: {
            type: Boolean,
            default: false
        },
        green: {
            type: Boolean,
            default: false
        },
        blue: {
            type: Boolean,
            default: false
        },
        orange: {
            type: Boolean,
            default: false
        },
        purple: {
            type: Boolean,
            default: false
        }
    },

    // Metadata for the project
    metadata: {
        title: {
            type: String,
            default: ""
        },
        artist: {
            type: String,
            default: ""
        },
        album: {
            type: String,
            default: ""
        },
        year: {
            type: String,
            default: ""
        },
        track: {
            type: String,
            default: ""
        },
        genre: {
            type: String,
            default: ""
        },
        comment: {
            type: String,
            default: ""
        },
    },

    // Sharelink for the project
    // Only the owner can initially see the share link
    // Only the randomised end part of the link is stored in the database
    sharelink: {
        type: String,
        default: ""
    },

    // session token is used so that only one user can edit the project at a given time
    // This session token will be updated peridically, and if it expires, then
    // another user can attempt to gain access to the project
    sessiontoken: {
        type: String,
        default: ""
    }

});

module.exports = Project = mongoose.model('projects', ProjectSchema);