window.onload = function() {
  
    // var file = document.getElementById("thefile");
    // var file = "public/yacht.mp3"
    // var audio = document.getElementById("audio");
    var audio = document.getElementById("audio");
    var playButton = document.getElementById("playButton");
  
    function testing(){
      console.log("got clicked")
    }
  
    audio.addEventListener('click', testing)
  
    audio.load();
  
    playButton.addEventListener('click', function() {
      var context = new (window.AudioContext || window.webkitAudioContext)();
      var src = context.createMediaElementSource(audio);
      var analyser = context.createAnalyser();
  
      var canvas = document.getElementById("canvas");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      var ctx = canvas.getContext("2d");
  
      src.connect(analyser);
      analyser.connect(context.destination);
  
      analyser.fftSize = 256;
  
      var bufferLength = analyser.frequencyBinCount;
      var dataArray = new Uint8Array(bufferLength);
  
      var WIDTH = canvas.width;
      var HEIGHT = canvas.height;
  
      var barWidth = (WIDTH /bufferLength) * 4;
      var barHeight;
      var x = 0;
  
  
      function renderFrame() {
        requestAnimationFrame(renderFrame);
  
        x = 0;
  
        analyser.getByteFrequencyData(dataArray);
  
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
        for (var i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] * 5
          
          var r = barHeight + (25 * (i/bufferLength));
          var g = 200 * (i/bufferLength);
          var b = 200 + (105 * (i / bufferLength));
  
          ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
          ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
  
          x += barWidth + 1;
        }
      }
  
      audio.play();
      renderFrame();
    });
  };