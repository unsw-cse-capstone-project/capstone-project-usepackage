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

//PREFLIGHT REQUEST
const cors = require('cors');
// const { reverse } = require('core-js/fn/array');
// const { resolve } = require('core-js/fn/promise');
// const { resolve } = require('core-js/fn/promise');
projects.use(cors({
    'allowedHeaders': ['authorization', 'Content-Type', 'ProjMetadata', 'FinalMetadata', 'Stack', 'Tag', 'ProjectCollab', 'ProjectInfo'],
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
    let tags = JSON.parse(req.headers.tag);
    let search = req.headers.search;
    for(let key in tags) {
        if(tags[key] === false) {
            delete tags[key];
        } else {
            tags["tags."+key] = tags[key];
            delete tags[key];
        }
    }
    console.log(tags);
    const userQuery = {
        username: req.token.username
    };
    User.findOne(userQuery).then(userObj => {
        const query = {
            ...tags,
            owner: userObj._id,
            name: {$regex: search}
        };
        const found = Project.find(query).then(result => {
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
            // let toSend2 = [];
            const collabQuery = {
                // query
                ...tags,
                collaborators: { $elemMatch: { $eq: userObj._id } },
                name: {$regex: search}
            };
            Project.find(collabQuery).then(result2 => {
                let queue = [];
                function f(toSend, ownerQuery) {
                    return new Promise( (resolve, reject) => {
                        User.findOne(ownerQuery).then(result3 => {
                        // console.log("RESULT 3", result3)
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
                result2.forEach((result2i, i) => {
                    const ownerQuery = {
                        _id: result2i.owner
                    }
                    queue.push(f(toSend, ownerQuery));
                })
                return queue.reduce((prev, curr) => {
                    return prev.then(siz => {
                        siz = siz.concat(curr)
                        return curr
                    });
                }, Promise.resolve(toSend));
            }).then((intermediateResult) => {
                const mine = intermediateResult.filter(entry => entry.owner === req.token.username);
                const nein = intermediateResult.filter(entry => entry.owner !== req.token.username);
                const finalResult = [mine, nein];
                console.log("REACHED", finalResult)
                res.json(finalResult);
            });;
        })
    })
});

projects.get("/audiofiles", checkToken, (req, res, next) => {
    console.log("LOAD REACHED");
    const metaData = JSON.parse(req.headers.projmetadata);
    const query = {
        filename: {$regex: metaData.owner + "-" + metaData.name + "-" + req.headers.nth + ".mp3"} 
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

projects.get('/getstack', checkToken, (req, res, next) => {

    const metaData = JSON.parse(req.headers.projmetadata);
    const query = {
        filename: {$regex: metaData.owner + "-" + metaData.name + "-" + req.headers.nth + ".mp3"} 
    }
    gfs.files.find(query).toArray((err, files) => {
        if (!files || files.length === 0) {
            return res.status(404).json({
                message: "Could not find file"
            });
        }
        const metaData = JSON.parse(req.headers.projmetadata);
        const userQuery = {
            username: metaData.owner
        }
        User.findOne(userQuery).then(userObj => {
            
            const projQuery = {
                owner: userObj._id,
                name: metaData.name
            }
            Project.findOne(projQuery).then(projObj => {
                for(let i = 0; i < projObj.files.length; i++) {
                    console.log(projObj.files[i].file_id.toString());
                    console.log(files[0]._id.toString());
                    if(projObj.files[i].file_id.toString() === files[0]._id.toString()) {
                        console.log("EQUAL!");
                        res.send(projObj.files[i].stack);
                    }
                }
            });
        });
    });
});

projects.get("/numfiles", checkToken, (req, res, next) => {
    console.log("GETTIN NUM FILES");
    const metaData = JSON.parse(req.headers.projmetadata);
    const userQuery = {
        username: metaData.owner
    };
    User.findOne(userQuery).then(userObj => {
        const projectData = {
            name: metaData.name,
            owner: userObj._id
        };
        console.log("project info: ", projectData);
        Project.findOne(projectData).then(proj => {
            console.log("actual proj: ", proj);
            console.log(proj.files.length.toString());
            if (proj) {
                res.send(proj.files.length.toString());
            } else {
                res.send("fail");
            }
        });
    });
});

projects.post('/create', checkToken, (req, res, next) => {
    const linkLength = Math.random()*15 + 10;

    let linkStr = "";
    for(let i = 0; i < linkLength; i++) {
        const ranChar = String.fromCharCode(parseInt(Math.random()*25 + 65));
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
        .then( que => {
            console.log(que)
            numProj = que.length
            console.log("LENGTH:", numProj)
            // each user will be limited to a maximum of 5 projects
            if(numProj >= 5) {
                res.send("limit reached");
                return false;
            }
            return true;
        })
        .then( result => {
            if(result !== false) {
                const projectData = {
                    name: req.body.projectName,
                    owner: userObj._id
                };
                Project.findOne(projectData).then(proj => {
                    console.log("Project found?", proj)
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
                    } else {
                        res.send("fail");
                    }
                });
            }
        });
    });
});

projects.post('/save', [checkToken, testMiddleWare], (req, res, next) => {
    const meta = JSON.parse(req.headers.finalmetadata);
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
    // console.log("STACK ", req.headers.stack)
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
                // const audid = audioObj._id;
                const audioEntry = {
                    file_id: audioObj._id,
                    stack: req.headers.stack
                }
                // const newProjObj = {
                //     _id: projObj._id,
                //     name: projObj.name,
                //     owner: projObj.owner,
                //     collaborators: projObj.collaborators,
                //     files: [...projObj.files, audid],
                // }
                const today = new Date();
                Project.updateOne({ _id: projObj._id }, { $push: { files: audioEntry}, $set: { date: today }, $set: { metadata: meta } }).then((stat) => {
                    console.log("UPDATED", stat);
                    res.send("success");
                });
            });
        });
    });
});

projects.get('/totalspace', checkToken, (req, res, next) => {

    function f1(query) {
        return new Promise( (resolve, reject) => {
            gfs.files.find(query).toArray( (err, files) => {
                console.log("QUERY: ", query);
                console.log("FILES: ", files[0]);
                resolve(files[0].length);
            })
        });
    }

    function f2(query) {
        return new Promise( (resolve, reject) => {
            let queue = [];
            let totalSize = 0;
            Project.find(query).then(arr => {
                // console.log("arr null?", arr);
                for(let i = 0; i < arr.length; i++) {
                    // console.log("arr loop 1: ", arr[i].files);
                    for(let j = 0; j < arr[i].files.length; j++) {
                        queue.push(f1({ _id: arr[i].files[j].file_id })
                        );
                    }
                }
            }).then(() => {
                console.log(queue);
                return queue.reduce((prev, curr) => {
                    return prev.then(x => {
                        totalSize += x;
                        return curr
                    });
                }, Promise.resolve(totalSize))
            }).then((curr) => {
                resolve(totalSize + curr)
            });
        });
    }
    User.findOne({ username: req.token.username }).then(userObj => {
        f2({ owner: userObj._id }).then(totalSize => {
            console.log(totalSize);
            res.send(totalSize.toString(10))
        });
    });
});

projects.get('/enoughspace', checkToken, (req, res, next) => {

    function f1(query) {
        return new Promise( (resolve, reject) => {
            gfs.files.find(query).toArray( (err, files) => {
                resolve(files[0].length);
            })
        });
    }

    function f2(query) {
        return new Promise( (resolve, reject) => {
            let queue = [];
            let totalSize = 0;
            Project.find(query).then(arr => {
                for(let i = 0; i < arr.length; i++) {
                    for(let j = 0; j < arr[i].files.length; j++) {
                        queue.push(f1({ _id: arr[i].files[j].file_id })
                        );
                    }
                }
            }).then(() => {
                console.log(queue);
                return queue.reduce((prev, curr) => {
                    return prev.then(x => {
                        totalSize += x;
                        return curr
                    });
                }, Promise.resolve(totalSize))
            }).then((curr) => {
                resolve(totalSize + curr)
            });
        });
    }
    const metaData = JSON.parse(req.headers.projmetadata);
    User.findOne({ username: metaData.owner }).then(userObj => {
        const projQuery = {
            owner: userObj._id
        }
        const projection = {
            projection:  { name: metaData.name }
        }
        f2(projQuery, projection).then(totalSize => {
            console.log(totalSize);
            res.send(totalSize.toString(10))
        });
    });
});

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

projects.get('/deleteall', checkToken, (req, res, next) => {
    const metaData = JSON.parse(req.headers.projmetadata);
    let filesToRemove = [];
    User.findOne({ username: metaData.owner }).then(userObj => {
        const projQuery = {
            name: metaData.name,
            owner: userObj._id
        }
        Project.findOne(projQuery).then(projObj => {
            projObj.files.forEach( fileObj => {
                filesToRemove.push(gfs.remove({ _id: fileObj._id }))
            });
            return projObj._id
        }).then((id) => {
            filesToRemove.reduce((prev, curr) => {
                console.log("REMOVING FILE");
                return prev.then(curr);
            }, Promise.resolve())
            return id
        }).then((id) => {
            Project.updateOne({ _id: id }, { $set: {files: []}}).then( () => {
                res.send("Removed files");
            });
        });
    }).catch( err => res.send(err));
});

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
            Project.updateOne({ _id: projObj._id }, { $set: { [`tags.${colo}`]: state }}).then( () => {
                res.send("success");
            });
        });
    }).catch(err => res.send(err));
});

projects.get('/getmetadata', checkToken, (req, res, next) => {
    const metaData = JSON.parse(req.headers.projmetadata);
    User.findOne({ username: metaData.owner }).then(userObj => {
        const projQuery = {
            name: metaData.name,
            owner: userObj._id
        }
        Project.findOne(projQuery).then(projObj => {
            const meta = projObj.metadata;
            res.json(meta);
        });
    }).catch(err => res.send(err));
});

projects.get('/addcollaborator', checkToken, (req, res, next) => {
    const collabData = JSON.parse(req.headers.projectcollab);
    console.log(collabData);
    if(collabData.owner === req.token.username) {
        res.status(998).send("same user cannot collaborate with himself")
    }
    // res.status(999).send("yeah nah");
    User.findOne({ username: collabData.owner }).then(userObj => {
        console.log("FOUND USER")
        const projQuery = {
            name: collabData.name,
            owner: userObj._id,
            sharelink: collabData.ranstr
        }
        Project.findOne(projQuery).then(projObj => {
            console.log("FOUND PROJECT?");
            if(projObj === null) {
                res.status(995).send("Oops something went wrong!");
                return;
            }
            User.findOne({ username: req.token.username }).then(userObj2 => {
                if(!projObj.collaborators.includes(userObj2._id)) {
                    Project.updateOne({ _id: projObj._id }, { $push: { collaborators: userObj2._id } }).then((stat) => {
                        console.log({
                            name: projObj.name,
                            owner: collabData.owner,
                            date: projObj.date,
                            tags: projObj.tags
                        });
                        res.json({
                            name: projObj.name,
                            owner: collabData.owner,
                            date: projObj.date,
                            tags: projObj.tags
                        });
                        return;
                    }).catch(err => res.status(990).send("yeah nah"));
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
        console.log(err);
        res.status(992).send("yeah nah");
    });
});

// when a user attempts to 
projects.get('/attemptaccess', checkToken, (req, res, next) => {
    // note: projmetadata contains owner and name
    const metaData = JSON.parse(req.headers.projmetadata);
    User.findOne({ username: metaData.owner }).then(userObj => {
        const projQuery = {
            name: metaData.name,
            owner: userObj._id
        }
        Project.findOne(projQuery).then(projObj => {
            const sesstoken = projObj.sessiontoken
            // first check whether sesstoken is an empty string.
            if(sesstoken === "") {
                const payload = {
                    projid: projObj._id
                };
                let token = jwt.sign(payload, process.env.SECRET_KEY, {
                    expiresIn: 60
                });
                Project.updateOne(projQuery, { $set: { sessiontoken: token } }).then(() => {
                    res.send(token);
                    return;
                });
            }
            // if sesstoken is not empty, we need to check if the token is valid
            jwt.verify(sesstoken, process.env.SECRET_KEY, (err, authorisedData) => {
                if (err) {
                    // token timed out. allocate session.
                    const payload = {
                        projid: projObj._id
                    };
                    let token = jwt.sign(payload, process.env.SECRET_KEY, {
                        expiresIn: 60
                    });
                    Project.updateOne(projQuery, { $set: { sessiontoken: token } }).then(() => {
                        res.send(token);
                        return;
                    });
                } else {
                    // token is valid. we need to check whether the owner is equal to the editor
                    // allocate if true
                    if(req.token.username === metaData.owner) {
                        const payload = {
                            projid: projObj._id
                        };
                        let token = jwt.sign(payload, process.env.SECRET_KEY, {
                            expiresIn: 60
                        });
                        Project.updateOne(projQuery, { $set: { sessiontoken: token } }).then(() => {
                            res.send(token);
                            return;
                        });
                    } else {
                        res.status(999).send("Cannot allocate session!");
                    }
                }
            });
        });
    }).catch(err => res.send(err));
});

projects.get('/updateaccess', checkToken, (req, res, next) => {
    const metaData = JSON.parse(req.headers.projmetadata);
    const projtoken = req.headers.projectinfo;
    User.findOne({ username: metaData.owner }).then(userObj => {
        // obtain user id
        const projQuery = {
            name: metaData.name,
            owner: userObj._id
        }
        Project.findOne(projQuery).then(projObj => {
            if(projtoken === projObj.sessiontoken) {
                const payload = {
                    projid: projObj._id
                };
                let token = jwt.sign(payload, process.env.SECRET_KEY, {
                    expiresIn: 60
                });
                Project.updateOne(projQuery, { $set: { sessiontoken: token } }).then(() => {
                    res.send(token);
                    return;
                });
            } else {
                res.status(999).send("Token does not match!");
            }
        });
    }).res(err => res.send(err));
});

// deal with profile later.
module.exports = projects;