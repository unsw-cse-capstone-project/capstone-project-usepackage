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

const app = express(),
    DIST_DIR = __dirname,
    WORKLET_DIR = path.join(DIST_DIR, '../src/js/myWorklets'),
    LIB_DIR = path.join(DIST_DIR, '../lib'),


    HTML_FILE = path.join(DIST_DIR, 'index.html'),
    PROFILE_FILE = path.join(DIST_DIR, 'profile.html'),
    LOGIN_FILE = path.join(DIST_DIR, 'login.html'),
    REGISTER_FILE = path.join(DIST_DIR, 'register.html'),
    compiler = webpack(config)

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

const mongoURI = 'mongodb://localhost:27017/usepackage'

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

app.get('/home', (req, res, next) => {
    // compiler.outputFileSystem.readFile(HTML_FILE, (err, result) => {
    //     if (err) {
    //         console.log(req.url)
    //         return next(err)
    //     }
    //     res.set('content-type', 'text/html')
    //     res.send(result)
    //     res.end()
    // })
    res.sendFile(HTML_FILE)
})

app.get('/register', (req, res, next) => {
    res.sendFile(REGISTER_FILE)
});

app.get('/login', (req, res, next) => {
    res.sendFile(LOGIN_FILE);
})

app.get('/profile', (req, res, next) => {
    res.sendFile(PROFILE_FILE)
})




const PORT = process.env.PORT || 8080

app.listen(PORT, () => {
    console.log(`App listening to ${PORT}....`)
    console.log('Press Ctrl+C to quit.')
})