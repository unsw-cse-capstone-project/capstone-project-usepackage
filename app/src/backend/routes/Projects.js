const express = require('express');
const projects = express.Router();
const Project = require('../models/Project');
const jwt = require('jsonwebtoken');

process.env.SECRET_KEY = 'secret'


// checks if header is undefined. 
const checkToken = (req, res, next) => {
    const header = req.headers['authorization'];
    if(typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];
        req.token = token;
        next();
    }
    else {
        res.sendStatus(403);
    }
}

/*
 * GET /projects/getprojects
 * body must contain the username (required for query)
 * authentication is done by passing in a jwt token for verification
 * based on username passed and given,
 * token must be verified (to check if the given user is logged in)
 * and only list the projects if the token is verified
 */
projects.get('/getprojects', checkToken, (req, res) => {
    jwt.verify(req.token, process.env.SECRET_KEY, (err, authorisedData) => {
        if(err) {
            console.log("ERROR: could not connect to the protected route");
            res.sendStatus(403);
        }
        else {
            console.log("SUCCESS: retrieving list of projects of user");
            // query here
            const query = {
                owners: { $elemMatch: { $eq: req.body.username } }
            };
            Project.find(query).toArray ( (err, result) => {
                if(err) throw err;
                res.send(result);
            });
        }
    });
});

// deal with profile later.
module.exports = projects;
