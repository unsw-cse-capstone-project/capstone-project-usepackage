let worker;

function parseArguments(text) {
    text = text.replace(/\s+/g, ' ');
    var args = [];
    // Allow double quotes to not split args.
    text.split('"').forEach(function(t, i) {
        t = t.trim();
        if ((i % 2) === 1) {
            args.push(t);
        } else {
            args = args.concat(t.split(" "));
        }
    });
    return args;
}

function runCommand(text) {
    var args = parseArguments(text);
    console.log(args);
    worker.postMessage({
        type: "command",
        arguments: args,
        files: []
    });
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