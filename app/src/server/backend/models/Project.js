const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const ProjectSchema = new Schema({
    name: {
        type: String,
        required: true
    },

    date: {
        type: Date,
        default: Date.now
    },

    owner: {
        type: mongoose.Types.ObjectId,
        required: true
    },

    collaborators: {
        type: [mongoose.Types.ObjectId]
    },

    files: [{
        file_id: { type: mongoose.Types.ObjectId },
        stack: { type: String }
    }],

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
        yellow: {
            type: Boolean,
            default: false
        },
        purple: {
            type: Boolean,
            default: false
        }
    }
});

module.exports = Project = mongoose.model('projects', ProjectSchema);