const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema ({
    // First name of the user
    first_name: {
        type: String
    },
    
    // Last name of the user
    last_name: {
        type: String
    },

    // username (required and unique)
    username: {
        type: String,
        required: true
    },
    
    // hashed password of the user
    password: {
        type: String,
        required: true
    },
    
    // Date the user was created .
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = User = mongoose.model('users', UserSchema);
