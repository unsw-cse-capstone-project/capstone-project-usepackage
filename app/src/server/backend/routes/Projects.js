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
const mongo = require('mongodb');


/**
 * Projects.js
 * Routes defined for creating, deleting projects, uploading and downloading audio files in the project,
 * and validating project sessions. 
 */


//PREFLIGHT REQUEST
const cors = require('cors');

/**
 * Headers contain vital information as to how projects should be dealt with
 * Authorization: Contains the user token. Always needed to check the validity of the user that is attempting to obtain information
 *                of the object or change the project.
 * Content-Type:  Determies the type of audio file that is about to be uploaded to the server
 * ProjMetadata:  (Not to be confused with the metadata in the Project Schema) Has the name and owner of the project
 * FinalMetadata: The actual project metadata in the Project Schema stored in the database
 * Stack:         The edit history of each audio file
 * Tag:           The five colour tags of the project. Used for updating the tag of the project or filtering projects based on tags
 * ProjectCollab: Contains the owner of the project as a String, as well as the random string.
 *                The random string needs to match with what's stored in the database in order to successfully add the collaborator.
 * ProjectInfo:   Contains the project token. Project tokens are used to check whether one can access the project immediately
 *                Access won't be granted if someone else is already editing the project (does not apply for owners gaining access)
 */
projects.use(cors({
    'allowedHeaders': ['authorization', 'content-type', 'projmetadata', 'finalmetadata', 'ftack', 'tag', 'projectcollab', 'projectinfo'],
}));

projects.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Grid.mongo = mongo;


let gfs = Grid(db, mongoDriver);

// storage is responsible for uploading audio files to the database
const storage = GridFsStorage({
    db: db,
    file: (req, file) => {
        // name of the file stored in the database will be based on the owner's name, project name, and the nth file to be uploaded
        const metaData = JSON.parse(req.headers.projmetadata);
        const query = {
            filename: metaData.owner + "-" + metaData.name + "-" + file.originalname
        }
        return new Promise((resolve, reject) => {
            // before uploading file, check if duplicate exists
            gfs.files.findOne(query).then(fileObj => {
                // console.log("file originally not in db");
                // console.log(req.headers.projmetadata)
                // Upload if it does not exist
                if (!fileObj) {
                    // console.log("file does not exist; create");
                    req.audiofilename = query.filename
                    req.metadata = metaData
                    resolve({
                        filename: metaData.owner + "-" + metaData.name + "-" + file.originalname
                    })
                }
                // Delete duplicate files before uploading 
                else {
                    // console.log("file exists; replace");
                    req.prevaid = fileObj._id; // if previous audio file exists, obtain id, pass it, then replace old id with new id in proj.files
                    gfs.remove({ _id: fileObj._id }).then(() => {
                        // console.log("SUCCESS");
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

// Middleware that checks if the user token is valid. Will return 403 if not valid
// Otherwise, the decrypted token will be stored and sent. 
const checkToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (typeof token !== 'undefined') {
        jwt.verify(token, process.env.SECRET_KEY, (err, authorisedData) => {
            if (err) {
                res.sendStatus(403);
                throw new Error("ERROR: invalid token!")
            } else {
                req.token = authorisedData;
                next();
            }
        });
    } else {
        res.sendStatus(403);
    }
}

// Middleware responsible for uploading file 
const testMiddleWare = multer({ storage: storage }).single('file');

/*
 * GET /projects/getprojects
 * body must contain the username (required for query)
 * authentication is done by passing in a jwt token for verification
 * based on username passed and given,
 * token must be verified (to check if the given user is logged in)
 * and only list the projects if the token is verified
 * list of projects returned is based on:
 * The regex search query (if provided)
 * The tags of each projects (if provided)
 */
projects.get('/', checkToken, (req, res) => {
    // verify validity of token here
    let tags = JSON.parse(req.headers.tag);
    let search = req.headers.search;
    // Filter tags. Remove tags with the false field. 
    for (let key in tags) {
        if (tags[key] === false) {
            delete tags[key];
        } else {
            tags["tags." + key] = tags[key];
            delete tags[key];
        }
    }
    // console.log(tags);
    const userQuery = {
        username: req.token.username
    };
    User.findOne(userQuery).then(userObj => {
        // query projects based on tags, search query, and projects the owner owns 
        const query = {
            ...tags,
            owner: userObj._id,
            name: { $regex: search }
        };
        const found = Project.find(query).then(result => {
            // toSend is a list of projects that the owner owns
            // search and tag filters apply
            let toSend = result.map(item => {
                return {
                    name: item.name,
                    owner: userObj.username,
                    date: item.date,
                    tags: item.tags,
                    str: item.sharelink
                }
            })
            return toSend
        }).then(toSend => {
            // Everything concatenated to toSend after this point
            // are collaborated projects. 
            // Same query conditions apply. 
            const collabQuery = {
                // query
                ...tags,
                collaborators: { $elemMatch: { $eq: userObj._id } },
                name: { $regex: search }
            };
            Project.find(collabQuery).then(result2 => {
                // Sync issues here.
                // Solution: Store promises in a queue, resolve everything afterwards by reducing
                let queue = [];

                // f is the function that, provided the array to store projects and the ownerQuery
                // that contains the id of the owner of such projects,
                // returns a concatenated list of toSend.
                // the concatenated projects are those owned by one particular user
                function f(toSend, ownerQuery) {
                    return new Promise((resolve, reject) => {
                        User.findOne(ownerQuery).then(result3 => {
                            console.log("RESULT 3", result3)
                            toSend = toSend.concat(result2.map(item => {
                                return {
                                    name: item.name,
                                    owner: result3.username,
                                    date: item.date,
                                    tags: item.tags
                                }
                            }));
                            resolve(toSend);
                        });
                    });
                }

                // Obtain all of the owner of projects in which the user has collaborative rights
                // the function f is not executed. They are merely stored in the queue
                result2.forEach((result2i, i) => {
                    const ownerQuery = {
                        _id: result2i.owner
                    }
                    queue.push(f(toSend, ownerQuery));
                })
                // Resolve the queue of promises, and send this to the next step
                return queue.reduce((prev, curr) => {
                    return prev.then(siz => {
                        siz = siz.concat(curr)
                        return curr
                    });
                }, Promise.resolve(toSend));
            }).then((intermediateResult) => {
                // mine is the list of projects that the user owns
                const mine = intermediateResult.filter(entry => entry.owner === req.token.username);
                // nein is the list of projects in which is the user is a collaborator
                const nein = intermediateResult.filter(entry => entry.owner !== req.token.username);
                // send Final result, an array of arrays. 
                const finalResult = [mine, nein];
                // console.log("REACHED", finalResult)
                res.json(finalResult);
            });;
        })
    })
});

/*
 * GET /projects/audiofiles
 * body must contain the username (required for query)
 * authentication is done by passing in a jwt token for verification
 * based on username passed and given,
 * token must be verified (to check if the given user is logged in)
 * headers.nth must be a nonnegative integer
 * headers.nth denotes the nth audio file of the project.
 * Once all basic authentications are done, the audio file will be sent to the client
 */
projects.get("/audiofiles", checkToken, (req, res, next) => {
    // console.log("LOAD REACHED");
    const metaData = JSON.parse(req.headers.projmetadata);
    // find filename in the db.
    // format is "owner-name-int.mp3"
    const query = {
        filename: { $regex: metaData.owner + "-" + metaData.name + "-" + req.headers.nth + ".mp3" }
    }
    gfs.files.find(query).toArray((err, files) => {
        if (!files || files.length === 0) {
            return res.status(404).json({
                message: "Could not find file"
            });
        }

        // upon successfully finding the file, send back to client as readstream
        var readstream = gfs.createReadStream({
            filename: files[0].filename
        })
        res.set('Content-Type', files[0].contentType);
        return readstream.pipe(res);
    });
});

/*
 * GET /projects/getstack
 * body must contain the username (required for query)
 * authentication is done by passing in a jwt token for verification
 * based on username passed and given,
 * token must be verified (to check if the given user is logged in)
 * headers.nth must be a nonnegative integer
 * headers.nth denotes the nth audio file of the project.
 * Once all basic authentications are done, the edit history of the audio file will be sent to the client
 */
projects.get('/getstack', checkToken, (req, res, next) => {

    const metaData = JSON.parse(req.headers.projmetadata);
    const query = {
        filename: { $regex: metaData.owner + "-" + metaData.name + "-" + req.headers.nth + ".mp3" }
    }
    gfs.files.find(query).toArray((err, files) => {
        if (!files || files.length === 0) {
            return res.status(404).json({
                message: "Could not find file"
            });
        }

        // Once the file in the db is found
        const metaData = JSON.parse(req.headers.projmetadata);
        const userQuery = {
            username: metaData.owner
        }
        // We need to find the userid to find the project in which the audio file is contained
        User.findOne(userQuery).then(userObj => {

            const projQuery = {
                owner: userObj._id,
                name: metaData.name
            }
            Project.findOne(projQuery).then(projObj => {
                // For all files in the project, we find one that matches the file object id.
                for (let i = 0; i < projObj.files.length; i++) {
                    // console.log(projObj.files[i].file_id.toString());
                    // console.log(files[0]._id.toString());
                    if (projObj.files[i].file_id.toString() === files[0]._id.toString()) {
                        // console.log("EQUAL!");
                        // once found, send the edit history to the client. 
                        res.send(projObj.files[i].stack);
                    }
                }
            });
        });
    });
});

/*
 * GET /projects/numfiles
 * For a given project, determines how many audio files are associated in a project
 */
projects.get("/numfiles", checkToken, (req, res, next) => {
    // console.log("GETTIN NUM FILES");
    // console.log("GETTIN NUM FILES");
    const metaData = JSON.parse(req.headers.projmetadata);
    const userQuery = {
        username: metaData.owner
    };
    User.findOne(userQuery).then(userObj => {
        const projectData = {
            name: metaData.name,
            owner: userObj._id
        };
        // console.log("project info: ", projectData);
        Project.findOne(projectData).then(proj => {
            // Once the project in the db is found, we simply send the length of the file array
            // console.log("actual proj: ", proj);
            // console.log(proj.files.length.toString());
            if (proj) {
                res.send(proj.files.length.toString());
            } else {
                res.send("fail");
            }
        });
    });
});

/*
 * POST /projects/create
 * Create a project for a user
 */
projects.post('/create', checkToken, (req, res, next) => {
    // sharelink string's length is between 10 and 25
    const linkLength = Math.random() * 15 + 10;

    // sharelink string will be based on all caps 
    let linkStr = "";
    for (let i = 0; i < linkLength; i++) {
        const ranChar = String.fromCharCode(parseInt(Math.random() * 25 + 65));
        linkStr = linkStr.concat(ranChar);
    }

    const userQuery = {
        username: req.token.username
    };
    User.findOne(userQuery).then(userObj => {
        // first find the number of projects the user owns
        const projectNumData = {
            owner: userObj._id
        }
        let numProj = 0;
        Project.find(projectNumData)
        .then(que => { // we first check the number of projects the user currently owns. It should not be equal to the max quota
            // console.log(que)
            numProj = que.length
            // console.log("LENGTH:", numProj)
                // each user will be limited to a maximum of 5 projects (practically this will be larger)
            if (numProj >= 5) {
                res.send("limit reached");
                return false;
            }
            return true;
        })
        .then(result => {
            // enough space to allocate new project
            if (result !== false) {
                const projectData = {
                    name: req.body.projectName,
                    owner: userObj._id
                };
                // console.log("Project Data: ", projectData)
                // now check whether project with the same name under the same user exists
                Project.findOne(projectData).then(proj => {
                    // console.log("Project found?", proj)
                    // project name is unique --> attempt to create new project
                    if (!proj) {
                        const newProjectData = {
                            name: req.body.projectName,
                            owner: userObj._id,
                            sharelink: linkStr
                        };
                        Project.create(newProjectData)
                            .then(newProj => {
                                res.send("success");
                            })
                            .catch(err => {
                                res.send(err);
                            })
                    }
                    // project with same name sxists
                    else {
                        res.send("fail");
                    }
                });
            }
        });
    });
});

/*
 * POST /projects/save
 * Saves the project
 * Only one audio file is saved at a time 
 */
projects.post('/save', [checkToken, testMiddleWare], (req, res, next) => {
    const meta = JSON.parse(req.headers.finalmetadata);
    const projname = req.metadata.name
    const ownername = req.metadata.owner
    const userQuery = {
        username: ownername
    };
    User.findOne(userQuery).then(userObj => {
        // console.log("FOUND YSer");
        const uid = userObj._id;
        const projQuery = {
            name: projname,
            owner: uid
        }
        Project.findOne(projQuery).then(projObj => {
            // console.log("FOUND PROJCET");
            const audioQuery = {
                filename: req.audiofilename
            }
            // Store the specified audio file to the database
            gfs.files.findOne(audioQuery).then(audioObj => {
                // console.log("FOUND FILE IN GRIDFS");
                // const audid = audioObj._id;
                const audioEntry = {
                    file_id: audioObj._id,
                    stack: req.headers.stack
                }
                const today = new Date();
                Project.updateOne({ _id: projObj._id }, { $push: { files: audioEntry }, $set: { date: today }, $set: { metadata: meta } }).then((stat) => {
                    // console.log("UPDATED", stat);
                    res.send("success");
                });
            });
        });
    });
});


// f1 is a function that takes in a file query
// it returns a promise that resolve the size of the audio file (in Bytes)
function getFileSizePromise(query) {
    return new Promise((resolve, reject) => {
        gfs.files.find(query).toArray((err, files) => {
            resolve(files[0].length);
        })
    });
}

// accumulateFileSize is a function that returns a promise. It takes in project query
// accumulateFileSize pushes all the getFileSizePromise promises in the queue, then reduces all the promises in
// the queue and accumulates the entire size of the project in Bytes.
function accumulateFileSize(query) {
    return new Promise((resolve, reject) => {
        let queue = [];
        let totalSize = 0;
        Project.find(query).then(arr => {
            // console.log("arr null?", arr);
            for (let i = 0; i < arr.length; i++) {
                // console.log("arr loop 1: ", arr[i].files);
                for (let j = 0; j < arr[i].files.length; j++) {
                    queue.push(getFileSizePromise({ _id: arr[i].files[j].file_id }));
                }
            }
        }).then(() => {
            // console.log(queue);
            // resolve all the promises in the queue by reducing
            return queue.reduce((prev, curr) => {
                return prev.then(x => {
                    totalSize += x;
                    return curr
                });
            }, Promise.resolve(totalSize))
        }).then((curr) => {
            resolve(totalSize + curr) // edge case: final size is not accumulated, so this is done manually here
        });
    });
}

/*
 * GET /projects/totalspace
 * returns the cumulative size of all projects of a given user
 */
projects.get('/totalspace', checkToken, (req, res, next) => {
    User.findOne({ username: req.token.username }).then(userObj => {
        // Once accumulateFileSize accumulates the filesize, return this result back to the client
        accumulateFileSize({ owner: userObj._id }).then(totalSize => {
            // console.log(totalSize);
            res.send(totalSize.toString(10))
        });
    });
});


/*
 * GET /projects/enoughspace
 * returns the cumulatie size of all projects of a given user except the current project
 */
projects.get('/enoughspace', checkToken, (req, res, next) => {
    const metaData = JSON.parse(req.headers.projmetadata);
    User.findOne({ username: metaData.owner }).then(userObj => {
        const projQuery = {
            owner: userObj._id
        }
        // projection removes results from the query that has the specified field
        const projection = {
            projection: { name: metaData.name }
        }
        accumulateFileSize(projQuery, projection).then(totalSize => {
            // console.log(totalSize);
            res.send(totalSize.toString(10))
        });
    });
});

/*
 * GET /projects/deleteproject
 * Deletes the project. Note: /deleteall is called before this is called. 
 */
projects.get('/deleteproject', checkToken, (req, res, next) => {
    const metaData = JSON.parse(req.headers.projmetadata);
    User.findOne({ username: metaData.owner }).then(userObj => {
        const projQuery = {
            name: metaData.name,
            owner: userObj._id
        }
        Project.deleteOne(projQuery, (err, obj) => {
            if (err) {
                res.send(err);
                return;
            }
            res.send("success");
        });
    }).catch(err => res.send(err));
});

/*
 * GET /projects/deleteall
 * Deletes all audio files associated to a given project
 */
projects.get('/deleteall', checkToken, (req, res, next) => {
    const metaData = JSON.parse(req.headers.projmetadata);
    let filesToRemove = [];
    User.findOne({ username: metaData.owner }).then(userObj => {
        const projQuery = {
            name: metaData.name,
            owner: userObj._id
        }
        // find project in which you want to delete all the files
        Project.findOne(projQuery).then(projObj => {
            // push the remove commands to a queue
            projObj.files.forEach(fileObj => {
                filesToRemove.push(gfs.remove({ _id: fileObj._id }))
            });
            return projObj._id
        }).then((id) => {
            // perform reduce/remove
            filesToRemove.reduce((prev, curr) => {
                // console.log("REMOVING FILE");
                return prev.then(curr);
            }, Promise.resolve())
            return id
        }).then((id) => {
            // set the file array in the project to []
            Project.updateOne({ _id: id }, { $set: { files: [] } }).then(() => {
                res.send("Removed files");
            });
        });
    }).catch(err => res.send(err));
});

/*
 * GET /projects/changetag
 * Changes the tag combination of a project
 */
projects.get('/changetag', checkToken, (req, res, next) => {
    const metaData = JSON.parse(req.headers.projmetadata);
    const tag = JSON.parse(req.headers.tag);
    const colo = tag.colour;
    const state = tag.state;
    User.findOne({ username: metaData.owner }).then(userObj => {
        const projQuery = {
            name: metaData.name,
            owner: userObj._id
        }
        Project.findOne(projQuery).then(projObj => {
            Project.updateOne({ _id: projObj._id }, {
                // set the tags to what was given from the client
                $set: {
                    [`tags.${colo}`]: state
                }
            }).then(() => {
                res.send("success");
            });
        });
    }).catch(err => res.send(err));
});

/*
 * GET /projects/getmetadata
 * returns the project metadata to the user
 */
projects.get('/getmetadata', checkToken, (req, res, next) => {
    const metaData = JSON.parse(req.headers.projmetadata);
    User.findOne({ username: metaData.owner }).then(userObj => {
        const projQuery = {
            name: metaData.name,
            owner: userObj._id
        }
        // send metadata once project is found
        Project.findOne(projQuery).then(projObj => {
            const meta = projObj.metadata;
            res.json(meta);
        });
    }).catch(err => res.send(err));
});

/*
 * GET /projects/addcollaborator
 * adds a collaborator to a given project
 */
projects.get('/addcollaborator', checkToken, (req, res, next) => {
    const collabData = JSON.parse(req.headers.projectcollab);
    // console.log(collabData);
    if (collabData.owner === req.token.username) {
        res.status(998).send("same user cannot collaborate with himself")
    }
    // res.status(999).send("yeah nah");
    User.findOne({ username: collabData.owner }).then(userObj => {
        // console.log("FOUND USER")
        const projQuery = {
            name: collabData.name,
            owner: userObj._id,
            sharelink: collabData.ranstr
        }
        Project.findOne(projQuery).then(projObj => {
            // console.log("FOUND PROJECT?");
            if (projObj === null) {
                res.status(995).send("Project not found!");
                return;
            }
            User.findOne({ username: req.token.username }).then(userObj2 => {
                // case: user is not in the list of collaborators for the project 
                if (!projObj.collaborators.includes(userObj2._id)) {
                    Project.updateOne({ _id: projObj._id }, { $push: { collaborators: userObj2._id } }).then((stat) => {
                        // console.log({
                        //     name: projObj.name,
                        //     owner: collabData.owner,
                        //     date: projObj.date,
                        //     tags: projObj.tags
                        // });
                        res.json({
                            name: projObj.name,
                            owner: collabData.owner,
                            date: projObj.date,
                            tags: projObj.tags
                        });
                        return;
                    }).catch(err => res.status(990).send("Error in adding the collaborator to the project"));
                }
                res.json({
                    name: projObj.name,
                    owner: collabData.owner,
                    date: projObj.date,
                    tags: projObj.tags
                });
                return;
            }).catch(err => res.status(993).send("yeah nah"));

        }).catch(err => res.status(996).send(""));
    }).catch(err => {
        // console.log(err);
        res.status(992).send("yeah nah");
    });
});

function updateProjectToken(id, projQuery) {
    const payload = {
        projid: id
    };
    let token = jwt.sign(payload, process.env.SECRET_KEY, {
        expiresIn: 60
    });
    return Project.updateOne(projQuery, { $set: { sessiontoken: token } }).then(() => {
        return token;
    });
}

/*
 * GET /projects/attemptaccess
 * When a user attempts to gain access to the project
 * attemptaccess will check project token validity
 * if token is expired or owner is attempting to access project
 *   attemptaccesss immediately grants access and appropriately updates tokens
 * otherwise, if the token is valid an a collaborator is attempting to access project
 * it will not work!
 */
projects.get('/attemptaccess', checkToken, (req, res, next) => {
    // note: projmetadata contains owner and name
    const metaData = JSON.parse(req.headers.projmetadata);
    const projtoken = req.headers.projectinfo;
    User.findOne({ username: metaData.owner }).then(userObj => {
        const projQuery = {
            name: metaData.name,
            owner: userObj._id
        }
        Project.findOne(projQuery).then(projObj => {
            const sesstoken = projObj.sessiontoken
                // first check whether sesstoken (in the database) is an empty string.
            if (sesstoken === "" || sesstoken === projtoken) {
                updateProjectToken(projObj._id, projQuery).then((token) => res.send(token));
            } else {
                // if sesstoken is not empty, we need to check if the token is valid
                jwt.verify(sesstoken, process.env.SECRET_KEY, (err, authorisedData) => {
                    if (err) {
                        // token timed out. allocate session.
                        updateProjectToken(projObj._id, projQuery).then((token) => res.send(token));
                    } else {
                        // token is valid. we need to check whether the owner is equal to the editor
                        // allocate if true
                        if (req.token.username === metaData.owner) {
                            updateProjectToken(projObj._id, projQuery).then((token) => res.send(token));
                        } else {
                            res.status(999).send("Cannot allocate session!");
                        }
                    }
                });
            }
        });
    }).catch(err => res.send(err));
});

/*
 * GET /projects/updateaccess
 * Updates project token every 30 seconds, provided the current token is valid and is the same. 
 */
projects.get('/updateaccess', checkToken, (req, res, next) => {
    // console.log("The metadata: ", req.headers.projmetadata)
    const metaData = JSON.parse(req.headers.projmetadata);
    const projtoken = req.headers.projectinfo;
    User.findOne({ username: metaData.owner }).then(userObj => {
        // obtain user id
        const projQuery = {
            name: metaData.name,
            owner: userObj._id
        }
        Project.findOne(projQuery).then(projObj => {
            // console.log("projtoken: ", projtoken);
            // console.log("projObj.sessionToken: ", projObj.sessiontoken);
            if (projtoken === projObj.sessiontoken) {
                updateProjectToken(projObj._id, projQuery).then((token) => res.send(token));
            } else {
                res.status(999).send("Token does not match!");
            }
        });
    }).catch(err => res.status(888).send(err));
});

// deal with profile later.
module.exports = projects;