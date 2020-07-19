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

    owners: {
        type: [String],
        required: true
    },

    files: {
        type: [mongoose.Types.ObjectId]
    }
});

module.exports = Project = mongoose.model('projects', ProjectSchema);