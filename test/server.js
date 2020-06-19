import path from 'path'
import express from 'express'

const app = express();
const MAINFILE = path.join(__dirname, "index.html");

app.use(express.static(__dirname))

app.get('/', (req, res) => {
    res.sendFile(MAINFILE);
})

const PORT = 8080;

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
    console.log('Press Ctrl C to quit')
})
