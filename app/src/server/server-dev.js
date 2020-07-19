import path from 'path'
import express from 'express'
import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import config from '../../webpack.dev.config.js'
import bodyParser from 'body-parser'
import fetch from 'cross-fetch'

const app = express(),
    DIST_DIR = __dirname,
    WORKLET_DIR = path.join(DIST_DIR, '../src/js/myWorklets'),
    LIB_DIR = path.join(DIST_DIR, '../lib'),
    HTML_FILE = path.join(DIST_DIR, 'index.html'),
    compiler = webpack(config)

app.use(webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath
}));
app.use(webpackHotMiddleware(compiler));
app.use(bodyParser.json());
app.use(express.static(DIST_DIR));

// POST Requests

const dbURL = "http://localhost:5000"

// deprecated; do not use
app.post('/confirmation', (req, res, next) => {
    console.log(req.body);
    var jsonBody = null;
    if (req.body.password !== req.body.confirmPassword) {
        res.send("password mismatch");
        return;
    }
    res.send("Password matches");
    const userData = {
        first_name: req.body.firstname,
        last_name: req.body.lastname,
        email: req.body.email,
        password: req.body.password
    }
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    };

    return new Promise((resolve) => fetch(dbURL + '/users/register', requestOptions)
        .then(res2 => res2.json())
        .then(josn => console.log(josn)));

});

// GET Requests

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

app.get('/myProcessor.js', (req, res, next) => {
    res.sendFile(path.join(WORKLET_DIR, 'myProcessor.js'))
})

app.get('/AbstractFifoSamplePipe.js', (req, res, next) => {
    res.sendFile(path.join(WORKLET_DIR, 'AbstractFifoSamplePipe.js'))
})

app.get('/RateTransposer.js', (req, res, next) => {
    res.sendFile(path.join(WORKLET_DIR, 'RateTransposer.js'))
})

app.get('/Cut.js', (req, res, next) => {
    res.sendFile(path.join(WORKLET_DIR, 'Cut.js'))
})

app.get('/ActionStack.js', (req, res, next) => {
    res.sendFile(path.join(WORKLET_DIR, 'ActionStack.js'))
})

app.get('/Stretch.js', (req, res, next) => {
    res.sendFile(path.join(WORKLET_DIR, 'Stretch.js'))
})

app.get('/FifoSampleBuffer.js', (req, res, next) => {
    res.sendFile(path.join(WORKLET_DIR, 'FifoSampleBuffer.js'))
})

app.get('/recorder/recorder.js', (req, res, next) => {
    res.sendFile(path.join(LIB_DIR, 'recorder/recorder.js'));
})

app.get('/soundtouch/soundtouch-worklet.js', (req, res, next) => {
    res.sendFile(path.join(LIB_DIR, 'soundtouch/soundtouch-worklet.js'));
})

app.get('/lamejs.js', (req, res, next) => {
    res.sendFile(path.join(LIB_DIR, 'lamejs.js'));
})

app.get('/libvorbis.js', (req, res, next) => {
    res.sendFile(path.join(LIB_DIR, 'vorbis.js'));
})

app.get('/vorbis.js', (req, res, next) => {
    res.sendFile(path.join(LIB_DIR, 'ogg.js'));
})

app.get('/stretch.js', (req, res, next) => {
    res.sendFile(path.join(LIB_DIR, 'stretch.js'));
})



app.get('/register', (req, res, next) => {
    // compiler.outputFileSystem.readFile(REGISTER_FILE, (err, result) => {
    //     if (err) {
    //         return next(err)
    //     }
    //     res.set('content-type', 'text/html')
    //     res.send(result)
    //     res.end()
    // })
    res.sendFile(path.join(DIST_DIR, 'register.html'));
});

app.get('/login', (req, res, next) => {
    // compiler.outputFileSystem.readFile(HTML_FILE, (err, result) => {
    //     if (err) {
    //         return next(err)
    //     }
    //     res.set('content-type', 'text/html')
    //     res.send(result)
    //     res.end()
    // })
    res.sendFile(path.join(DIST_DIR, 'login.html'));
})



const PORT = process.env.PORT || 8080

app.listen(PORT, () => {
    console.log(`App listening to ${PORT}....`)
    console.log('Press Ctrl+C to quit.')
})