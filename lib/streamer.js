var spawn = require("child_process").spawn;
var debug = require("debug")("motion");

function Streamer(config){
	this.config = config;

	function fixDst(config){
		const newOptions = [];
		for(var i = 0; i < config.options.length; i++){
			newOptions[i] = config.options[i];
			if(newOptions[i] === "--sout" && !!config.options[i + 1] && !!config.port){
				var newSout = config.options[i + 1].substring(0, config.options[i + 1].length - 1);
				newSout += `,dst=:${config.port}}`;
				newOptions[i + 1] = newSout;
				break;
			}
		}
		return newOptions;
	}

	function fixWebDst(config){
		let newOptions = [];
		newOptions.push('--no-drop-late-frames');
		newOptions.push('--no-skip-frames');
		newOptions = newOptions.concat([
			'--sout',
			(`#transcode{\
				vcodec=h264,fps=15,venc=x264{\
					preset=ultrafast,\
					tune=zerolatency,\
					keyint=30,\
					bframes=0,\
					ref=1,\
					level=30,\
					profile=baseline,\
					hrd=cbr,\
					crf=20,\
					ratetol=1.0,\
					vbv-maxrate=1200,\
					vbv-bufsize=1200,\
					lookahead=0}\
			}:\
			standard{\
				access=http{\
					mime="video/MP2T"\
				},\
				mux=ts,\
				dst=:${config.webStreamPort}/\
			}`).replace(/\s/g, '')
		]);

		// for(var i = 0; i < config.options.length; i++){
		// 	newOptions[i] = config.options[i];
		// 	if(newOptions[i] === "--sout" && !!config.options[i + 1] && !!config.webStreamPort){
		// 		var newSout = config.options[i + 1];
		// 		//config.options[i + 1].substring(0, config.options[i + 1].length - 1);
		// 		//newSout += ',dst=:'+config.webStreamPort+'}';
		// 		newSout = `#transcode{vcodec=mp1v,vb=1024,acodec=mpga,ab=128,samplerate=44100,channels=2,threads=4,scale=1}:standard{access=http,mux=ts,dst=:${config.webStreamPort}/}`;
		// 		newOptions[i + 1] = newSout;
		// 		break;
		// 	}
		// }
		return newOptions;
	}

	this.run = function(){
		var self = this;

		this.config.cameras.forEach(function(config, i){
			debug("Starting process "+i);
			var options = [config.url];
			options = options.concat(fixDst(config));

			var webOptions = [config.url];
			webOptions = webOptions.concat(fixWebDst(config));

			debug("Spawning cvlc", options);

			console.log(`cvlc ${webOptions.join(' ')}`);
			var cvlc = spawn('cvlc', options);
			var webCvlc = spawn('cvlc', webOptions);

			cvlc.stdout.on('data', (data) => {
			  debug('\033[33m'+data+'\033[0m');
			});

			cvlc.stderr.on('data', (data) => {
			  debug('\033[93m'+data+'\033[0m');
			});

			cvlc.on('close', (code) => {
			  debug(`child process exited with code ${code}`);
			});

			webCvlc.stdout.on('data', (data) => {
			  debug('\033[33m'+data+'\033[0m');
			});

			webCvlc.stderr.on('data', (data) => {
			  debug('\033[93m'+data+'\033[0m');
			});

			webCvlc.on('close', (code) => {
			  debug(`child process exited with code ${code}`);
			});

			webCvlc.on('error', (err) => {
			  debug('\033[33m'+err+'\033[0m');
			});

			process.on('close', (code) => {
				debug("Closing cvlc child process...");
				cvlc.kill('SIGHUP');
				webCvlc.kill('SIGHUP');
			});
			process.on('exit', (code) => {
				debug("Exiting cvlc child process...");
				cvlc.kill('SIGHUP');
				webCvlc.kill('SIGHUP');
			});
			process.on('SIGTERM', function () {
				debug("Killing cvlc child process...");
				cvlc.kill('SIGHUP');
				webCvlc.kill('SIGHUP');
			});
			process.on('SIGHUP', function () {
				debug("Killing cvlc child process...");
				cvlc.kill('SIGHUP');
				webCvlc.kill('SIGHUP');
			});
		});
	};
}

module.exports = Streamer;