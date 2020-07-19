// login/register related modules
var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var app = express();
const mongoose = require('mongoose');
// gridfs config
const path = require('path');
const logger = require('morgan');

let port = process.env.PORT || 5000

app.use(bodyParser.json());
app.use(cors());
app.use(
    bodyParser.urlencoded({
        extended: false
    })
);


const mongoURI = 'mongodb://localhost:27017/usepackage'

let Users = null, Files = null, Projects = null;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true }).then((conn) => {
    module.exports = conn
    Users = require('./routes/Users');
    Files = require('./routes/Files');
    Projects = require('./routes/Projects');

    app.use('/users', Users);
    app.use('/files', Files);
    app.use('/projects', Projects);

    console.log('MongoDB Connected');  
}).catch(err => { console.log(err); });

app.listen(port, () => {
    console.log('Server is running on port: ' + port);
});