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

var convertingImages = false;
var currentFrames = [];

var Streamer = require("./streamer");
var streamer = new Streamer(config);
streamer.run();

//wait 10 seconds
var interval = 0
var vlcInterval = setInterval(function(){
	console.log("Waiting for servers to run...", 10 - interval);
	if(10 === interval++){
		console.log("Calling start...");
		start();
		clearInterval(vlcInterval);
	}
}, 1000);

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

function convertImages(frames){
	// if(convertingImages){
	// 	var interval = setInterval(function(){
	// 		if(!convertingImages){
	// 			clearInterval(interval);
	// 			//get file list.
	// 			//include oldest file and any file within 100ms of the previous
	// 			convertImagesToVideo(frames);
	// 		}else{
	// 			console.log("waiting for another video to convert...");
	// 		}
	// 	}, 500);
	// }else{
		convertImagesToVideo(frames);
	// }
}

function convertImagesToVideo(frames){
	convertingImages = true;
	currentFrames = frames;
	//get start time
	var startTime = frames[0].time;
	var startDateTime = new Date(startTime);

	var filename = startDateTime.toISOString().replace(/:/g, "");

	var fullPath = './video/'+
		startDateTime.getFullYear()+'/'+(startDateTime.getMonth()+1)+'/'+startDateTime.getDate();

	var ffmpeg = require('ffmpeg-stream').ffmpeg;
	var converter = ffmpeg();

	try{
		fs.mkdirsSync(fullPath);
	}catch(err){
		console.log("Error creating the directory structure: "+fullPath);
	}


	var framesArr = currentFrames.map(function(frame){
		return frame.data;
	});

	var readable = streamify(framesArr);
	var fullFilename = fullPath+'/'+filename+'.mkv';

	try{
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
				convertingImages = false;
			}).catch(function(){
				console.log("Error transcoding mjpeg to mp4");
				convertingImages = false;
			});
		});
	}catch(err){
		if(err.message === "Already started"){
			setTimeout(function(){
				convertImagesToVideo(currentFrames);
			}, 1000);
		}else{
			convertingImages = false;
			throw err;
		}
	}
}

function transcodeMjpegVideo(fullFilename){
	return new Promise(function(resolve, reject){
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