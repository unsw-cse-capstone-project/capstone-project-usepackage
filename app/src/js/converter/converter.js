

function runCommand(text) {
    if (isReady()) {
      startRunning();
      var args = parseArguments(text);
      console.log(args);
      worker.postMessage({
        type: "command",
        arguments: args,
        files: []
      });
    }
  }

function initWorker() {
    worker = new Worker("worker-asm.js");
    worker.onmessage = function (event) {
      var message = event.data;
      if (message.type == "ready") {
        isWorkerLoaded = true;
        worker.postMessage({
          type: "command",
          arguments: ["-help"]
        });
      } else if (message.type == "stdout") {
        outputElement.textContent += message.data + "\n";
      } else if (message.type == "start") {
        outputElement.textContent = "Worker has received command\n";
      } else if (message.type == "done") {
        stopRunning();
        var buffers = message.data;
        if (buffers.length) {
          outputElement.className = "closed";
        }
        // buffers.forEach(function(file) {
        //   filesElement.appendChild(getDownloadLink(file.data, file.name));
        // });
      }
    };
  }