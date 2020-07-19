const files = require('express').Router();
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
        return {
            filename: file.originalname
        }
    }
});
// sets file input to single file
const singleUpload = multer({ storage: storage }).single('file');

// downloads provided file. :filename is given as argument/parameter. 
files.get('/:filename', (req, res) => {
    gfs.files.find({ filename: req.params.filename }).toArray((err, files) => {
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

// gets all files. We will need to modify this so that only files with the correct username is obtained
files.get('/', (req, res) => {
    gfs.files.find().toArray((err, files) => {
        if (!files || files.length === 0) {
            return res.status(404).json({
                message: "Could not find files"
            });
        }
        return res.json(files);
    });
});

// uploads files using gridFS
files.post('/', singleUpload, (req, res) => {
    console.log(req.file)
    if (req.file) {
        return res.json({
            success: true,
            file: req.file
        });
    }
    res.send({ success: false });
});

// deletes files in the the db
files.delete('/:id', (req, res) => {
    gfs.remove({ _id: req.params.id }, (err) => {
        if (err) return res.status(500).json({ success: false })
        return res.json({ success: true });
    })
})

module.exports = files;