const express = require('express');
const users = express.Router();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const User = require('../models/User');
// mount cors
users.use(cors());

/**
 * Users.js
 * Routes defined for creating and authenticating users
 */

process.env.SECRET_KEY = 'secret'

const checkToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (typeof token !== 'undefined') {
        jwt.verify(token, process.env.SECRET_KEY, (err, authorisedData) => {
            if(err) {
                res.sendStatus(403);
                throw new Error("ERROR: invalid token!")
            }
            else {
                req.token = authorisedData;
                next();
            }
        });   
    } else {
        res.sendStatus(403);
    }
}

/**
 * POST /users/register
 * Given req.body, which is comprised of username, first name,
 * last name, and two password fields, attempts to register the user
 * to the database.
 */
users.post('/register', (req, res) => {
    // should not work if both password fields are not complete
    if(req.body.password !== req.body.confirmPassword) {
        res.send("Passwords do not match.");
        return;
    }
    // should not work if the password field is empty
    if(req.body.password === "") {
        res.send("Password is required");
        return;
    }
    const today = new Date();
    // construct initial userdata object
    const userData = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        username: req.body.username,
        password: req.body.password,
        created: today
    };
    // find if email exists within database
    User.findOne({
        username: req.body.username
    }).then(user => {
        // successful case: user does not exist and registration can be done
        if(!user) {
            // hash password
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                userData.password = hash;
                // insert userdata to database
                User.create(userData).then(user => {
                    res.send("success");
                }).catch(err => {
                    res.send('error: ' + err);
                });
            });
        }
        // unsuccessful case: user with email already exists within database
        else {
            res.send("User Already exists. Registration unsuccessful. ");
            // res.json({
            //     error: 'User already exists'
            // });
        }
    }).catch(err => {
        res.send('error: ' + err);
    });
});

/**
 * POST /users/login
 * Given req.body, which has username and password,
 * attempts to authenticate the user
 */
users.post('/login', (req, res) => {
    User.findOne({
        username: req.body.username
    }).then(user => {
        if(user) {
            // check if hashed password equals what's in the database
            // password match
            if(bcrypt.compareSync(req.body.password, user.password)) {
                const payload = {
                    _id: user._id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    username: user.username
                };
                let token = jwt.sign(payload, process.env.SECRET_KEY, {
                    expiresIn: 1440
                });
                res.send(token);
            }
            // password mismatch
            else {
                res.send("Incorrect username or password");
            }
        }
        else {
            // user mismatch
            res.send("Incorrect username or password");
        }
    }).catch(err => {
        res.send('error: ' + err);
    })
});

// simply returns the first name of the user provided the usertoken
users.get('/userInfo', checkToken, (req, res, next) => {
    res.send(req.token.first_name);
})

// deal with profile later.
module.exports = users;
