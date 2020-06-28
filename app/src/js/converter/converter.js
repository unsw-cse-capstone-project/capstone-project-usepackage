let worker;

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
            if(isInputFile === true) audioFileNames.push(t);
            if(t === "-i") isInputFile = true;
            else if (t !== "") isInputFile = false;
        } else {
            // even arguments are not double quoted; add to args after splitting the spaces
            const tempArgs = t.split(" ")
            args = args.concat(tempArgs);
            tempArgs.forEach((t2, i) => {
                console.log(t2);
                if(isInputFile === true) audioFileNames.push(t2);
                if(t2 === "-i") isInputFile = true;
                else if (t !== "") isInputFile = false;
            });

        }
        // console.log(t + "" + i);
    });
    return args;
}

function runCommand(text) {
    let audioFileNames =  []
    let args = parseArguments(text, audioFileNames);
    console.log("the following is the array of arugments");
    console.log(args);
    console.log(audioFileNames);
    /*
    worker.postMessage({
        type: "command",
        // for each of the input audio files mentioned in args, it must be linked
        // to the corresponding data blob 
        arguments: args,
        files: []
    });
    */
}

function initWorker() {
    worker = new Worker("../ffmpeg/worker-asm.js");
    worker.onmessage = function(event) {
        var message = event.data;
        if (message.type == "ready") {
            worker.postMessage({
                type: "command",
                arguments: ["-help"]
            });
        } else if (message.type == "stdout") {
            console.log(message.data);
        } else if (message.type == "start") {
            console.log("Worker has received command\n");
        } else if (message.type == "done") {
            var buffers = message.data;
            console.log(buffers);
            // buffers.forEach(function(file) {
            //   filesElement.appendChild(getDownloadLink(file.data, file.name));
            // });
        }
    };
}

export {
    initWorker,
    runCommand
}