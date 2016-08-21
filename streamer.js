var spawn = require("child_process").spawn;

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
			console.log("Starting process "+i);
			var options = [config.url];
			
			fixDst(config);

			options = options.concat(config.options);
			var cvlc = spawn('cvlc', options);

			cvlc.stdout.on('data', (data) => {
			  console.log('\033[33m'+data+'\033[0m');
			});

			cvlc.stderr.on('data', (data) => {
			  console.log('\033[93m'+data+'\033[0m');
			});

			cvlc.on('close', (code) => {
			  console.log(`child process exited with code ${code}`);
			});

			process.on('close', (code) => {
				console.log("Closing cvlc child process...");
				cvlc.kill('SIGHUP');
			});
			process.on('exit', (code) => {
				console.log("Exiting cvlc child process...");
				cvlc.kill('SIGHUP');
			});
		});
	};
}

module.exports = Streamer;