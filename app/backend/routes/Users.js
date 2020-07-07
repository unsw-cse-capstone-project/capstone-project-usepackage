const express = require('express');
const users = express.Router();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const User = require('../models/User');
// mount cors
users.use(cors());

process.env.SECRET_KEY = 'secret'

users.post('/register', (req, res) => {
    const today = new Date();
    // construct initial userdata object
    const userData = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        password: req.body.password,
        created: today
    };
    
    // find if email exists within database
    User.findOne({
        email: req.body.email
    }).then(user => {
        // successful case: user does not exist and registration can be done
        if(!user) {
            // hash password
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                userData.password = hash;
                // insert userdata to database
                User.create(userData).then(user => {
                    res.json({ 
                        status: user.email + 'Registered!' 
                    });
                }).catch(err => {
                    res.send('error: ' + err);
                });
            });
        }
        // unsuccessful case: user with email already exists within database
        else {
            res.json({
                error: 'User already exists'
            });
        }
    }).catch(err => {
        res.send('error: ' + err);
    });
});

users.post('/login', (req, res) => {
    User.findOne({
        email: req.body.email
    }).then(user => {
        if(user) {
            // check if hashed password equals what's in the database
            // password match
            if(bcrypt.compareSync(req.body.password, user.password)) {
                const payload = {
                    _id: user._id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email
                };
                let token = jwt.sign(payload, process.env.SECRET_KEY, {
                    expiresIn: 1440
                });
                res.send(token);
            }
            // password mismatch
            else {
                res.json({
                    error: 'Incorrect username or password' 
                });
            }
        }
        else {
            // user mismatch
            res.json({
                error: 'Incorrect username or password'
            });
        }
    }).catch(err => {
        res.send('error: ' + err);
    })
});

// deal with profile later.
