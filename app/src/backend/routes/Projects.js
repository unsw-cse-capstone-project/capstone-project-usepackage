const express = require('express');
const projects = express.Router();
const Project = require('../models/Project');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
// const { mongo, connection } = require('mongoose');
const mongoose = require('mongoose');
const mongoDriver = mongoose.mongo;
const Grid = require('gridfs-stream');
const conn = require('../server')
    // Grid.mongo = mongo;

console.log("GridFS Connected")

const gfs = Grid(conn, mongoDriver);

// set up connection to db for file storage
const storage = GridFsStorage({
    db: conn,
    file: (req, file) => {
        console.log("In storage: ", req.token)
        return {
            filename: req.token.username + "-" + file.originalname
        }
    }
});

process.env.SECRET_KEY = 'secret'

const checkToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (typeof token !== 'undefined') {
        jwt.verify(token, process.env.SECRET_KEY, (err, authorisedData) => {
            if(err) {
                res.sendStatus(403);
                throw new Error("ERROR: could not connect to the protected route")
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

// checks if header is undefined. 
const testMiddleWare = multer({ storage: storage }).single('file');

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
projects.get('/', checkToken, (req, res) => {
    // verify validity of token here

    const query = {
        owners: { $elemMatch: { $eq: req.body.username } }
    };
    Project.find(query).toArray((err, result) => {
        if (err) throw err;
        // need to send array of projects back to client here
        res.send(result);
    });
});

projects.post('/', [checkToken, testMiddleWare], (req, res, next) => {
    console.log(req.token)
    console.log(req.file)
});

// deal with profile later.
module.exports = projects;