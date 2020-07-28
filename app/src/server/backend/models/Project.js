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

    // blk_data: [{
    //     tx_addr: {type: String, max: 100}, // to do: change to a list
    //     block_number: {type: String, max: 100}, // to do: change to a list
    // }]

    files: {
        type: [mongoose.Types.ObjectId]
    }
    // files: [{
    //     file_id: { type: mongoose.Types.ObjectId },
    //     stack: { type: [String]}
    // }]
});

module.exports = Project = mongoose.model('projects', ProjectSchema);