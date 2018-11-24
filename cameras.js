var request = require("request");
var MjpegConsumer = require("mjpeg-consumer");
var NMotionStream = require("./lib/nmotionstream");
var FileOnWrite = require("file-on-write");
var spawn = require("child_process").spawn;
var fs = require('fs-extra');
var Stream = require('stream');
var readable = new Stream.Readable({objectMode: true});
var streamify = require('stream-array');
var config = require('./config');
var debug = require('debug')('motion')

var currentFrames = [];

var Streamer = require("./lib/streamer");
var streamer = new Streamer(config);
streamer.run();

//wait 10 seconds
var mjpegIteration = 0;

var interval = 0;
var maxIterations = 20;
var vlcTimeout;
function waitToStart(){
	clearTimeout(vlcTimeout);
	debug("Waiting for servers to run...", maxIterations - interval);
	if(maxIterations === interval++){
		debug("Calling start...");
		start();
	}else{
		vlcTimeout = setTimeout(waitToStart, 1000);
	}
}
vlcTimeout = setTimeout(waitToStart, 1000);

function start(){
	console.log("Started.");
	var writer = new FileOnWrite({ 
	  path: './video',
	  ext: '.jpg',
	  filename: function(image) {
	    return image.time;
	  },
	  transform: function(image) {
	    return image.data;
	  },
	  sync: true
	});

	
	config.cameras.forEach(function(camera){
		var consumer = new MjpegConsumer();
		var motion = new NMotionStream({
			minimumMotion: 1,
			cacheSeconds: 5,
		 	threshold: 0x15, //21 (0x15) default
		 	minChange: 15, //10 default
		 	sendAllFrames: true
		});

		var options = {
		  url: "http://localhost:"+camera.port
		};

		motion.on('complete', function(data){
			convertImages(data);
		});

		request(options).pipe(consumer).pipe(motion);
	});
}

function getFullPath(startDateTime){
	return './video/'+
		startDateTime.getFullYear()+'/'+(startDateTime.getMonth()+1)+'/'+startDateTime.getDate();
}

function getFileName(startDateTime){
	return startDateTime.toISOString().replace(/:/g, "");
}

function createDirectoryStructure(startDateTime){
	var filename = getFileName(startDateTime);
	var fullPath = getFullPath(startDateTime);

	try{
		fs.mkdirsSync(fullPath);
	}catch(err){
		console.log("Error creating the directory structure: "+fullPath);
	}
}

function getFramesArray(currentFrames){
	return currentFrames.map(function(frame){
		return frame.data;
	});
}

function convertImages(frames){
	convertImagesToVideo(frames);
}

function convertImagesToVideo(frames){
	var startTime = frames[0].time;
	var startDateTime = new Date(startTime);

	currentFrames = frames;

	createDirectoryStructure(startDateTime);

	var ffmpeg = require('ffmpeg-stream').ffmpeg;
	var converter = ffmpeg();


	var framesArr = getFramesArray(currentFrames)

	var readable = streamify(framesArr);
	var fullFilename = getFullPath(startDateTime)+'/'+getFileName(startDateTime)+'.mkv';

	try{
		console.log("Converting images to video...")
		var input = converter.input({
			//framerate: (frames.inputFPS/2),
			f: 'image2pipe', 
			r: frames.inputFPS,
			vcodec: 'mjpeg'
		});
		readable.pipe(input);
		converter.output({
			f: 'image2',
			vcodec: 'mjpeg',
			qscale: 1,
			//crf: '20',
			//vf: "fps="+(frames.inputFPS/2),
			updatefirst: 1
		}).pipe(fs.createWriteStream(fullFilename));
		converter.run();
		converter.on('complete', function(){
			console.log("Done converting images to video.");
			console.log("Now transcoding mjpeg to mp4...");

			var transcodeConverter = transcodeMjpegVideo(fullFilename);
			transcodeConverter.then(function(){
				console.log("Done transcoding mjpeg to mp4");
			}).catch(function(){
				console.log("Error transcoding mjpeg to mp4");
			});
		});
	}catch(err){
		if(err.message === "Already started"){
			if(mjpegIteration < 10){
				mjpegIteration++;
				console.log("calling convertImagesToVideo one second from now...");
				setTimeout(function(){
					convertImagesToVideo(currentFrames);
				}, 1000);
			}else{
				console.log("Couldn't start due to previous ffmpeg task. Stopping task and starting a new one.");
				mjpegIteration = 0;
				convertImagesToVideo(currentFrames);
			}
		}else{
			throw err;
		}
	}
}

function transcodeMjpegVideo(fullFilename){
	return new Promise(function(resolve, reject){
		console.log("Converting mjpeg to mp4...");
		var ffmpeg = spawn('ffmpeg', [
			'-i', fullFilename,
			'-c:v', 'copy', 
			'-c:a', 'copy',
			fullFilename.replace('mkv', 'mp4')
		]);

		ffmpeg.stdout.on('data', (data) => {
			console.log(`stdout: ${data}`);
		});
		ffmpeg.stderr.on('data', (data) => {
			console.log(`stderr: ${data}`);
		});
		ffmpeg.on('close', (code) => {
		  console.log(`child process exited with code ${code}`);
		  fs.unlink(fullFilename);
		  resolve();
		});
	});
}