// login/register related modules
var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var app = express();
const mongoose = require('mongoose');
// gridfs config
const path = require('path');
const logger = require('morgan');

var port = process.env.PORT || 5000

app.use(bodyParser.json());
app.use(cors());
app.use(
    bodyParser.urlencoded({
        extended: false
    })
);


const mongoURI = 'mongodb://localhost:27017/usepackage'

let db = mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log('MongoDB Connected');
}).catch(err => {
    console.log(err);
});

var Users = require('./routes/Users');
var Projects = require('./routes/Projects');
var Files = require('./routes/Files');

app.use('/users', Users);
app.use('/projects', Projects);
app.use('/files', Files);

app.listen(port, () => {
    console.log('Server is running on port: ' + port);
});

module.exports = {
    db
}