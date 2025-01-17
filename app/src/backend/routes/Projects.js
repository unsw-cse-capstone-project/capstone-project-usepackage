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
const User = require('../models/User');

//PREFLIGHT REQUEST
const cors = require('cors');
projects.use(cors({
    'allowedHeaders': ['authorization', 'Content-Type'],
}));

projects.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Grid.mongo = mongo;

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
    const userQuery = {
        username: req.token.username
    };
    User.findOne(userQuery).then(userObj => {
        const query = {
            owner: userObj._id
        };
        const found = Project.find(query).then(result => {
            let toSend = result.map(item => {
                return {
                    name: item.name,
                    owner: userObj.username
                }
            })
            return toSend
        })
        
        .then(toSend => {
            const collabQuery = {
                // query
                collaborators: { $elemMatch: { $eq: userObj._id } }
            };
            Project.find(collabQuery).then(result2 => {
                const ownerQuery = {
                    _id: result2.owner
                }
                User.findOne(ownerQuery).then(result3 => {
                    let toSend2 = result2.map(item => {
                        return {
                            name: item.name,
                            owner: result3.username
                        }
                    })
                    const finalResult = [toSend, toSend2];
                    res.json(finalResult);
                })
            })
        })
    })
});

projects.get('/:uname/:pname', (req, res, next) => {
    // req.param.projname --> projname provided in url
    console.log("Here")
});

projects.post('/create', checkToken, (req, res, next) => {
    const userQuery = {
        username: req.token.username
    };
    User.findOne(userQuery).then(userObj => {
        const projectData = {
            name: req.body.projectName,
            owner: userObj._id
        };
        Project.findOne(projectData).then(proj => {
            console.log("Project found?", proj)
            if(!proj) {
                Project.create(projectData)
                .then(newProj => {
                    res.send("success");
                })
                .catch(err => {
                    res.send(err);
                })
            }
            else {
                res.send("fail");
            }
        });
    });
});

// deal with profile later.
module.exports = projects;