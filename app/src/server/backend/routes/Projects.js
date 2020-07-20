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
const db = require('../../server-dev')
const User = require('../models/User');

//PREFLIGHT REQUEST
const cors = require('cors');
projects.use(cors({
    'allowedHeaders': ['authorization', 'Content-Type', 'ProjMetadata'],
}));

projects.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Grid.mongo = mongo;


let gfs = Grid(db, mongoDriver);

// set up connection to db for file storage
const storage = GridFsStorage({
    db: db,
    file: (req, file) => {
        const metaData = JSON.parse(req.headers.projmetadata);
        const query = {
            filename: metaData.owner + "-" + metaData.name + "-" + file.originalname
        }
        return new Promise((resolve, reject) => {
            gfs.files.findOne(query).then(fileObj => {
                console.log("file originally not in db");
                console.log(req.headers.projmetadata)
                if (!fileObj) {
                    console.log("file does not exist; create");
                    req.audiofilename = query.filename
                    req.metadata = metaData
                    resolve({
                        filename: metaData.owner + "-" + metaData.name + "-" + file.originalname
                    })
                } else {
                    console.log("file exists; replace");
                    req.prevaid = fileObj._id; // if previous audio file exists, obtain id, pass it, then replace old id with new id in proj.files
                    gfs.remove({ _id: fileObj._id }).then(() => {
                        console.log("SUCCESS");
                        req.audiofilename = query.filename
                        req.metadata = metaData
                        resolve({
                            filename: metaData.owner + "-" + metaData.name + "-" + file.originalname
                        })
                    });
                }
            })
        }).catch(err => reject(err))
    }
});

process.env.SECRET_KEY = 'secret'

const checkToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (typeof token !== 'undefined') {
        jwt.verify(token, process.env.SECRET_KEY, (err, authorisedData) => {
            if (err) {
                res.sendStatus(403);
                throw new Error("ERROR: could not connect to the protected route")
            } else {
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
        }).then(toSend => {
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


// deprecated. do not use.
projects.get('/:uname/:pname', (req, res, next) => {
    // req.params.projname --> projname provided in url
    console.log(req.params.uname, " ", req.params.pname)
    const userQuery = {
        username: req.params.uname
    };
    User.findOne(userQuery).then(userObj => {
        const projectData = {
            name: req.params.pname,
            owner: userObj._id
        };
    });
    res.sendFile(path.join(__dirname, 'index.html'))
});

projects.get("/audiofiles", checkToken, (req, res, next) => {
    // we have the token and the req.headers.projmetadata
    // const userQuery = {
    //     name: req.token.username
    // };
    // User.findOne(userQuery).then(userObj => {
    //     const projectData = {
    //         name: req.body.projectName,
    //         owner: oserObj._id
    //     };
    //     Project.findOne(projectData).then(proj => {

    //         // gfs.files.find({ filename: req.params.filename }).toArray((err, files) => {
    //         //     if (!files || files.length === 0) {
    //         //         return res.status(404).json({
    //         //             message: "Could not find file"
    //         //         });
    //         //     }

    //         //     var readstream = gfs.createReadStream({
    //         //         filename: files[0].filename
    //         //     })
    //         //     res.set('Content-Type', files[0].contentType);
    //         //     return readstream.pipe(res);
    //         // });
    //     });
    // });
    // for now just send the file itself right away
    const metaData = JSON.parse(req.headers.projmetadata);
    const query = {
        filename: metaData.owner + "-" + metaData.name + "-" + "testfile.mp3"
    }
    gfs.files.find(query).toArray((err, files) => {
        if (!files || files.length === 0) {
            return res.status(404).json({
                message: "Could not find file"
            });
        }

        var readstream = gfs.createReadStream({
            filename: files[0].filename
        })
        res.set('Content-Type', files[0].contentType);
        return readstream.pipe(res);
    });

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
            if (!proj) {
                Project.create(projectData)
                    .then(newProj => {
                        res.send("success");
                    })
                    .catch(err => {
                        res.send(err);
                    })
            } else {
                res.send("fail");
            }
        });
    });
});

projects.get('/load', [checkToken], (req, res, next) => {
    /*
        Pass through project information
        For the project find the list of files -> get the first file in the array
        Create a readstream from the gridFS filesys
        Pipe it to the response
    */
    const metaData = JSON.parse(req.headers.projmetadata);
    // Get the owner
    const UserQuery = {
        username: metaData.owner
    }
    User.findOne(UserQuery).then(userObj => {
        const ProjQuery = {
            owner: userObj._id,
            name: metaData.name
        }
        Project.findOne(ProjQuery).then(projObj => {
            const GFSQuery = {
                _id: projObj.files[0] 
            }
            let readStream = gfs.createReadStream(GFSQuery);
            readStream.pipe(res).then((res) => {
                res.send()
            })
        })
    })
})

projects.post('/save', [checkToken, testMiddleWare], (req, res, next) => {
    console.log("REACHED POST AYY");
    /* 
        id of the owner of the project
        name of the project itself : 
            name of the owner of the project --> 
                project object from db --> 
                    query ids of all audio files --> 
                        insert this to files in project

        req.audiofilename = filename
        req.metadata = metaData
    */
    const projname = req.metadata.name
    const ownername = req.metadata.owner
    const userQuery = {
        username: ownername
    };
    User.findOne(userQuery).then(userObj => {
        console.log("FOUND YSer");
        const uid = userObj._id;
        const projQuery = {
            name: projname,
            owner: uid
        }
        Project.findOne(projQuery).then(projObj => {
            console.log("FOUND PROJCET");
            const audioQuery = {
                filename: req.audiofilename
            }
            gfs.files.findOne(audioQuery).then(audioObj => {
                console.log("FOUND FILE IN GRIDFS");
                const audid = audioObj._id;
                // const newProjObj = {
                //     _id: projObj._id,
                //     name: projObj.name,
                //     owner: projObj.owner,
                //     collaborators: projObj.collaborators,
                //     files: [...projObj.files, audid],
                // }
                Project.updateOne({ _id: projObj._id }, { $set: { files: [audid] } }).then((stat) => {
                    console.log("UPDATED", stat);
                    res.send("success");
                });
            });
        });
    });
});

// deal with profile later.
module.exports = projects;