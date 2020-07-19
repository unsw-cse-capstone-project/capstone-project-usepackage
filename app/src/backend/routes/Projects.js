const express = require('express');
const projects = express.Router();
const Project = require('../models/Project');
const jwt = require('jsonwebtoken');

process.env.SECRET_KEY = 'secret'


// checks if header is undefined. 
const checkToken = (req, res, next) => {
    const header = req.headers['authorization'];
    if (typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];
        req.token = token;
        next();
    } else {
        res.sendStatus(403);
    }
}

// list of routes that need to be implemented"
// GET /projects/getprojects      -> retrieves a list of projects that a certain user has access to
// POST /projects/postproject     -> upload a new project with the user as the owner.
//                                   it must upload the audio files attached to the project via gridFS
// PUT /projects/updateproject    -> saves an existing project with necessary modifications
//                                   it must upload any new audio files attached via gridFS
// DELETE /projects/deleteproject -> deletes a project
//                                   it must delete all the associated audio files in gridFS before proceeding

/*
 * GET /projects/getprojects
 * body must contain the username (required for query)
 * authentication is done by passing in a jwt token for verification
 * based on username passed and given,
 * token must be verified (to check if the given user is logged in)
 * and only list the projects if the token is verified
 */
projects.get('/getprojects', checkToken, (req, res) => {
    // verify validity of token here
    jwt.verify(req.token, process.env.SECRET_KEY, (err, authorisedData) => {
        if (err) {
            console.log("ERROR: could not connect to the protected route");
            res.sendStatus(403);
        } else {
            console.log("SUCCESS: retrieving list of projects of user");
            console.log(authorisedData);
            // query here; if authorisedData contains username,
            // there is no need to have req.body.username
            // leave for now
            const query = {
                owners: { $elemMatch: { $eq: req.body.username } }
            };
            Project.find(query).toArray((err, result) => {
                if (err) throw err;
                // need to send array of projects back to client here
                res.send(result);
            });
        }
    });
});

// deal with profile later.