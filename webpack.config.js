var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'public');
var APP_DIR = path.resolve(__dirname, 'src');

var config = {
	entry: [APP_DIR + '/index.jsx'],
	output: {
		path: BUILD_DIR,
		filename: 'bundle.js'
	},
	module : {
		rules: [
			{
				test: /\.jsx$/,
				include : APP_DIR,
				loader: "babel-loader"
			}
		]
	},
	devServer: {
		historyApiFallback: true,
		// progress: true,
		hot: true,
		inline: true,
		// https: true,
		port: 5000,
		contentBase: BUILD_DIR,
		proxy: {
			'/record': {
				target: 'http://localhost:3000',
				headers: {
					Connection: 'keep-alive'
				}
			},
			'/api': {
				target: 'http://localhost:3000',
				headers: {
					Connection: 'keep-alive'
				}
			}
		}
	}
};

module.exports = config;
