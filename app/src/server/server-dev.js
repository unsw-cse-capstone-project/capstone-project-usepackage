const path = require('path');
const express = require('express')
const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const config = require('../../webpack.dev.config.js')
const bodyParser = require('body-parser')
const fetch = require('cross-fetch')
const cors = require('cors')
const mongoose = require('mongoose')

/**
 * server-dev.js is where all the frontend loading routes are located at.
 */

const app = express(),
    DIST_DIR = __dirname,
    LIB_DIR = path.join(DIST_DIR, '../src/js/lib'),
    IMGS = path.join(DIST_DIR, '../src/img')

HTML_FILE = path.join(DIST_DIR, 'index.html'),
    PROFILE_FILE = path.join(DIST_DIR, 'profile.html'),
    LOGIN_FILE = path.join(DIST_DIR, 'login.html'),
    REGISTER_FILE = path.join(DIST_DIR, 'register.html'),
    COLLAB_FILE = path.join(DIST_DIR, 'collab.html'),
    compiler = webpack(config)


// configuration for frontend routes displayed here
app.use(webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath
}));
app.use(webpackHotMiddleware(compiler));
app.use(bodyParser.json());
app.use(express.static(DIST_DIR));

app.use(cors());
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

// URL to the backend
const mongoURI = 'mongodb://localhost:27017/usepackage'


// Users, Files, and Projects are defined so that routes to the backend can be used
// MongoDB must be running in a separate session for this to work. 
let Users = null,
    Files = null,
    Projects = null;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true }).then(conn => {
    const db = conn.connections[0].db
    module.exports = db
    Users = require('./backend/routes/Users');
    Files = require('./backend/routes/Files');
    Projects = require('./backend/routes/Projects');

    app.use('/users', Users);
    app.use('/files', Files);
    app.use('/projects', Projects);

    console.log('MongoDB Connected');
}).catch(err => { console.log(err); });

// Main page. Users are redirected directly to the Editor UI
app.get('/', (req, res, next) => {
    compiler.outputFileSystem.readFile(HTML_FILE, (err, result) => {
            if (err) {
                console.log(req.url)
                return next(err)
            }
            res.set('content-type', 'text/html')
            res.send(result)
            res.end()
        })
        // res.sendFile(HTML_FILE)
})

// same as the above. 
app.get('/home', (req, res, next) => {
    res.sendFile(HTML_FILE)
})

// Register page
app.get('/register', (req, res, next) => {
    res.sendFile(REGISTER_FILE)
});

// Login Page
app.get('/login', (req, res, next) => {
    res.sendFile(LOGIN_FILE);
})

// Profile Page. Note that the profile page will only work as intended if the user is logged in.
// If the user is not logged in, no projects will be displayed. 
app.get('/profile', (req, res, next) => {
    res.sendFile(PROFILE_FILE)
})

// Collaboration link. Note that the validity of the link is not checked until the user attempts to log in. 
app.get('/collabs/:ownername/:projectname/:randomlink', (req, res, next) => {
    res.sendFile(COLLAB_FILE)
})

app.get('/logo', (req, res, next) => {
    res.sendFile(path.join(IMGS, "/title.svg"))
})

app.get('/lib/ogg.js', (req, res, next) => {
    res.sendFile(path.join(LIB_DIR, "/ogg.js"));
})

app.get('/lib/libvorbis.js', (req, res, next) => {
    res.sendFile(path.join(LIB_DIR, "/libvorbis.js"));
})



const PORT = process.env.PORT || 8080

app.listen(PORT, () => {
    console.log(`App listening to ${PORT}....`)
    console.log('Press Ctrl+C to quit.')
})