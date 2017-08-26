var spawn = require("child_process").spawn;
var debug = require("debug")("motion");

function Streamer(config){
	this.config = config;

	function fixDst(config){
		for(var i = 0; i < config.options.length; i++){
			if(config.options[i] === "--sout" && !!config.options[i + 1] && !!config.port){
				var newSout = config.options[i + 1].substring(0, config.options[i + 1].length - 1);
				newSout += ',dst=:'+config.port+'}';
				config.options[i + 1] = newSout;
				break;
			}
		}
	}

	this.run = function(){
		var self = this;

		this.config.cameras.forEach(function(config, i){
			debug("Starting process "+i);
			var options = [config.url];
			
			fixDst(config);

			options = options.concat(config.options);
			debug("Spawning cvlc", options);
			var cvlc = spawn('cvlc', options);

			cvlc.stdout.on('data', (data) => {
			  debug('\033[33m'+data+'\033[0m');
			});

			cvlc.stderr.on('data', (data) => {
			  debug('\033[93m'+data+'\033[0m');
			});

			cvlc.on('close', (code) => {
			  debug(`child process exited with code ${code}`);
			});

			process.on('close', (code) => {
				debug("Closing cvlc child process...");
				cvlc.kill('SIGHUP');
			});
			process.on('exit', (code) => {
				debug("Exiting cvlc child process...");
				cvlc.kill('SIGHUP');
			});
		});
	};
}

module.exports = Streamer;