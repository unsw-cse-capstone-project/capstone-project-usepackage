import path from 'path'
import express from 'express'
import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import config from '../../webpack.dev.config.js'

const app = express(),
    DIST_DIR = __dirname,
    LIB_DIR = path.join(DIST_DIR, '../lib'),
    HTML_FILE = path.join(DIST_DIR, 'index.html'),
    compiler = webpack(config)

app.use(webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath
}))

app.use(webpackHotMiddleware(compiler))

app.use(express.static(DIST_DIR))

app.get('/', (req, res, next) => {
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

app.get('/ffmpeg/ffmpeg-worker.js', (req, res, next) => {
    res.sendFile(path.join(LIB_DIR, 'ffmpeg/ffmpeg-worker.js'));
})

app.get('/ffmpeg/ffmpeg.js', (req, res, next) => {
    res.sendFile(path.join(LIB_DIR, 'ffmpeg/ffmpeg.js'));
})

app.get('/recorder/recorder.js', (req, res, next) => {
    res.sendFile(path.join(LIB_DIR, 'recorder/recorder.js'));
})

app.get('/soundtouch/soundtouch-worklet.js', (req, res, next) => {
    res.sendFile(path.join(LIB_DIR, 'soundtouch/soundtouch-worklet.js'));
})

// app.get('/Home', (req, res, next) => {
//     compiler.outputFileSystem.readFile(HTML_FILE, (err, result) => {
//         if (err) {
//             console.log("An error is being thrown for some reason")
//             return next(err)
//         }
//         res.set('content-type', 'text/html')
//         res.send(result)
//         res.end()
//     })
// })


// app.get('/Register', (req, res, next) => {
//     compiler.outputFileSystem.readFile(HTML_FILE, (err, result) => {
//         if (err) {
//             return next(err)
//         }
//         res.set('content-type', 'text/html')
//         res.send(result)
//         res.end()
//     })
// })

// app.get('/Login', (req, res, next) => {
//     compiler.outputFileSystem.readFile(HTML_FILE, (err, result) => {
//         if (err) {
//             return next(err)
//         }
//         res.set('content-type', 'text/html')
//         res.send(result)
//         res.end()
//     })
// })


const PORT = process.env.PORT || 8080

app.listen(PORT, () => {
    console.log(`App listening to ${PORT}....`)
    console.log('Press Ctrl+C to quit.')
})