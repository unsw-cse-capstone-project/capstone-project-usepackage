export default class UploadHandler {
    constructor() {
        this.handleChange = this.handleChange.bind(this);
    }
    
    handleChange(files) {
        // only mp3 works on firefox; all three works on chromium
        const validFileTypes = ['audio/ogg', 'audio/mpeg', 'audio/wav'];
        let promises = [];
        for (const file of files) {
            const fileURL = URL.createObjectURL(file);
            // Validate that the file is of audio type
            const valid = validFileTypes.find(type => type === file.type);
            // TODO: Modal
            if(!valid) {
                alert('invalid file type for ' + file.name); 
                continue;
            }
            //Get data blob from the uploaded url
            promises.push((state) => fetch(fileURL).then(res => res.blob()).then(
                audioBlob => new Promise((resolve) => {
                    URL.revokeObjectURL(fileURL);
                    let fileReader = new FileReader();
                    fileReader.addEventListener('loadend', () => {
                        const audioCtx = new AudioContext();
                        const URI = URL.createObjectURL(audioBlob);
                        const audio = new Audio(URI);
                        //Generate a controller from this point?
                        const source = audioCtx.createMediaElementSource(audio);
                        const splitter = audioCtx.createChannelSplitter(2);
                        const gain = [audioCtx.createGain(), audioCtx.createGain()];
                        //
                        const analyser = [audioCtx.createAnalyser(), audioCtx.createAnalyser()];
                        const merger = audioCtx.createChannelMerger(2);

                        source.connect(splitter);
                        for (let i = 0; i < 2; i++) {
                            splitter.connect(gain[i], i);
                            gain[i].connect(analyser[i]);
                            analyser[i].connect(merger, 0, i);
                        }
                        merger.connect(audioCtx.destination);
                        
                        //
                        state = [...state, {
                            fileName: file.name,
                            element: audio,
                            gain: gain,
                            analyser: analyser,
                            arrayBuffer: fileReader.result,
                            URI: URI
                        }];
                        resolve(state);
                    });
                    fileReader.readAsArrayBuffer(audioBlob);
                })
            ).catch( err => {console.log(err);}));
        }
        return promises.reduce((prev, curr) => {
            return prev.then(curr);
        }, Promise.resolve([]));
    }
}