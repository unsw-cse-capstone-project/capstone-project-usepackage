let Recorder = window.Recorder;
import PitchShifter from '../modulator/PitchShifter';


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
                        audioCtx.decodeAudioData(fileReader.result.slice(), (audioBuffer) => {
                            console.log('decoded the buffer');

                            const URI = URL.createObjectURL(audioBlob);
                            const audio = new Audio(URI);
                            //Generate a controller from this point?
                            //const source = audioCtx.createMediaElementSource(audio);
                            const splitter = audioCtx.createChannelSplitter(2);
                            const gain = [audioCtx.createGain(), audioCtx.createGain()];
                            //
                            const analyser = [audioCtx.createAnalyser(), audioCtx.createAnalyser()];
                            const merger = audioCtx.createChannelMerger(2);

                            let shifter = new PitchShifter(audioCtx, audioBuffer, 16384);
                            // shifter.tempo = 1;
                            // shifter.pitch = 2;
                            shifter.on('play', (detail) => {
                                console.log(detail)
                            });
                            //source.connect(splitter);
                            for (let i = 0; i < 2; i++) {
                                splitter.connect(gain[i], i);
                                gain[i].connect(analyser[i]);
                                analyser[i].connect(merger, 0, i);
                            }
                            merger.connect(audioCtx.destination);
                            //gain[0].connect(low);
                            //high.connect(analyser[0]);

                            //
                            state = [...state, {
                                fileName: file.name,
                                element: audio,
                                ctx: audioCtx,
                                gain: gain,
                                // bands: {
                                //     low: low,
                                //     med: med,
                                //     high: high
                                // },
                                pitch: shifter,
                                splitter: splitter,
                                analyser: analyser,
                                arrayBuffer: fileReader.result,
                                audioBuffer: audioBuffer,
                                URI: URI
                            }];
                            resolve(state);
                        });
/*
                        let low = audioCtx.createBiquadFilter();
                        low.type = "lowshelf";
                        low.frequency.value = 320.0;
                        low.gain.value = 1;

                        let med = audioCtx.createBiquadFilter();
                        med.type = "peaking";
                        med.frequency.value = 1000.0;
                        med.Q.value = 0.5;
                        med.gain.value = 1;
                        low.connect(med);

                        let high = audioCtx.createBiquadFilter();
                        high.type = "highshelf";
                        high.frequency.value = 3200.0;
                        high.gain.value = 1;
                        med.connect(high);
       */

                    });
                    fileReader.readAsArrayBuffer(audioBlob);
                }).catch(err => {console.log(err);})
            ));
        }
        return promises.reduce((prev, curr) => {
            return prev.then(curr);
        }, Promise.resolve([]));
    }
}
