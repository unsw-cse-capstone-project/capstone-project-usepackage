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

    files: {
        type: [mongoose.Types.ObjectId]
    }
});

module.exports = Project = mongoose.model('projects', ProjectSchema);