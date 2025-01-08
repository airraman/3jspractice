var audio = document.getElementById("song");


const audioContext = new AudioContext();

recordPlayer.play();
let audioMotion = new AudioMotionAnalyzer(container, {
 source: recordPlayer, 
 height: 400,
 ansiBands: false,
 showScaleX: false,
 bgAlpha: 0,
 overlay: true,
 mode: 1,
 frequencyScale: "log",
 radial: true,
 showPeaks: false,
 channelLayout: "dual-vertical",
 smoothing: 0.7
});

//Start of Option Two

console.log(recordPlayer.src)

var context = new AudioContext();
var src = context.createMediaElementSource(recordPlayer);
var analyser = context.createAnalyser();

var ctx = container.getContext("2d");

src.connect(analyser);
analyser.connect(context.destination);

analyser.fftSize = 256;

var bufferLength = analyser.frequencyBinCount;
console.log(bufferLength);

var dataArray = new Uint8Array(bufferLength);

var WIDTH = container.width;
var HEIGHT = container.height;

var barWidth = (WIDTH / bufferLength) * 2.5;
var barHeight;
var x = 0;

function renderFrame() {
  requestAnimationFrame(renderFrame);

  x = 0;

  analyser.getByteFrequencyData(dataArray);

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (var i = 0; i < bufferLength; i++) {
    barHeight = dataArray[i];
    
    var r = barHeight + (25 * (i/bufferLength));
    var g = 250 * (i/bufferLength);
    var b = 50;

    ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
    ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

    x += barWidth + 1;
  }
}

renderFrame();