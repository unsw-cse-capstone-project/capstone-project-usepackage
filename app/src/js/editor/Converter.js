import ffmpeg  from "ffmpeg-webm.js";

let stdout = "";
let stderr = "";
// Print FFmpeg's version.
export const ffmpeg_v = ffmpeg({
  arguments: ["-version"],
  print: function(data) { stdout += data + "\n"; },
  printErr: function(data) { stderr += data + "\n"; },
  onExit: function(code) {
    console.log("Process exited with code " + code);
    console.log(stdout);
    console.log(stderr);
  },
});
