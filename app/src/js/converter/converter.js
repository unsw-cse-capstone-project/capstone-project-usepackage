let worker;

// DO NOT USE
/*
function parseArguments(text, audioFileNames) {
    // regex that replaces spaces of size 1+ to a single space
    text = text.replace(/\s+/g, ' ');
    let args = [];
    let isInputFile = false;
    // Allow double quotes to not split args.
    // e.g. text = "-i inputfile.wav \"input file.wav\" \"output file.wav\""
    // -->         "-i inputfile.wav " ++ "input file.wav" ++ " " ++ "output file.wav" ++ ""
    // -->         "-i inputfile.wav" ++ "input file.wav" ++ "" ++  "output file.wav" ++ ""
    // -->          ["-i", "inputfile.wav", "input file.wav", "", "output file.wav", ""]
    text.split('"').forEach(function(t, i) {
        t = t.trim();
        // odd arguments are double quoted; push as is
        if ((i % 2) === 1) {
            args.push(t);
            console.log(t + " " + isInputFile);
            if (isInputFile === true && t !== "") audioFileNames.push(t);
            if (t === "-i") isInputFile = true;
            else if (t !== "") isInputFile = false;
        } else {
            // even arguments are not double quoted; add to args after splitting the spaces
            const tempArgs = t.split(" ")
            args = args.concat(tempArgs);
            tempArgs.forEach((t2) => {
                console.log(t2);
                if (isInputFile === true && t !== "") audioFileNames.push(t2);
                if (t2 === "-i") isInputFile = true;
                else if (t !== "") isInputFile = false;
            });
        }
        // console.log(t + "" + i);
    });
    return args;
}*/

function runCommand(inputFiles, outputFileName) {
    // instead of parsing in a full string for the argument, it might be better to parse in 
    // inputFiles is oftype [{file: "input.wav", data: audioBlob-UInt8Array}] and 
    // outputFileName is oftype "output.wav"
    // let audioFileNames = []
    // let args = parseArguments(text, audioFileNames);
    let args = ["-y"]
    Array.from(inputFiles).forEach((inputFile) => {
        args.push("-i");
        args.push(inputFile.name);
    });
    // the following merges the multiple audio files into one
    args.push("-filter_complex");
    args.push("amix=inputs=" + Array.from(inputFiles).length);
    args.push(outputFileName);

    /*const result = ffmpeg({
          MEMFS: [{name: "test.webm", data: testData}],
          arguments: ["-i", "test.webm", "-c:v", "libvpx", "-an", "out.webm"],
      });*/
    /*// Write out.webm to disk.
         const out = result.MEMFS[0];
         fs.writeFileSync(out.name, Buffer(out.data)); */

    //ffmpeg -i file1.mp3 file2.ogg
    //MEMFS: [{string, ArrayBuffer}]
    /*
        ArrayBuffer -> Blob -> URL (has the extension)
        ffmpeg -i {URL} -i {URL} -i {URL} {outputFile}
        
        mod_file1.mp3, mod_file2.mp3
    */
    console.log(args);
    console.log(inputFiles);
    worker.postMessage({
        type: "command",
        arguments: args,
        files: inputFiles
    });
}

function initWorker() {
    worker = new Worker("/ffmpeg/ffmpeg-worker.js");
    worker.onmessage = function(event) {
        let message = event.data;
        switch (message.type) {
            case "stdout":
                console.log(message.data);
                break;

            case "start":
                console.log("Worker has received command\n");
                break;

            case "done":
                {
                    let buffers = message.data;
                    console.log(buffers);
                    // buffers.forEach(function(file) {
                    //   filesElement.appendChild(getDownloadLink(file.data, file.name));
                    // });
                }
                break;

            case "ready":
                worker.postMessage({
                    type: "command",
                    arguments: []
                });
                break;

            default:
                console.log(message);
        }
    };
}

export {
    initWorker,
    runCommand
}