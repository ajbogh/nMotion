const express = require('express');
const path = require('path');
const fs = require('fs');
const port = process.env.PORT || 3000;
const app = express();
const config = require('./config');
const ffmpeg = require('fluent-ffmpeg');

// serve static assets normally
// app.use(express.static(__dirname + '/public'));
const cameraRecordProcesses = {};

app.get('/record/:cameraName', (request, response) =>{
  console.log('-----record camera', request.params);
  const { cameraName } = request.params;
  const name = decodeURIComponent(cameraName);

  if(cameraRecordProcesses[name]) {
    response.sendStatus(201);
    return;
  }

  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const outputPath = `${path.resolve(__dirname)}/recordings/${name}/${year}/${month}/${day}`;

  fs.mkdirSync(outputPath, { recursive: true });

  cameraRecordProcesses[name] = ffmpeg(`http://localhost:8000/live/${cameraName}.flv`)
    .videoCodec('libx264')
    .videoBitrate('1024k')
    .audioCodec('aac')
    .duration(config.maximumRecordingSeconds) // force stop after MAX seconds.
    .on('error', function(err) {
      console.log('An error occurred: ' + err.message);
    })
    .on('end', function() {
      console.log('Processing finished !');
    })
    .save(`./recordings/${name}/${year}/${month}/${day}/${date.toISOString()}.avi`);
  
  response.sendStatus(200);
});

app.get('/record/:cameraName/stop', (request, response) =>{
  console.log('-----stop record camera', request.params);
  const { cameraName } = request.params;
  const name = decodeURIComponent(cameraName);
  if(cameraRecordProcesses[name]){
    cameraRecordProcesses[name].kill();
    delete cameraRecordProcesses[name];
    response.sendStatus(200);
    return;
  }

  response.sendStatus(404);
});

// Handles all routes so you do not get a not found error
// app.get('*', function (request, response){
//     response.sendFile(path.resolve(__dirname, 'public', 'index.html'))
// });

const server = app.listen(port);
console.log("server started on port " + port);

function onExit() {
  if(cameraRecordProcesses) {
    Object.keys(cameraRecordProcesses).forEach(key => {
      cameraRecordProcesses[key].kill();
    });
  }

  server.close();
}

process.on('SIGINT', onExit);
process.on('exit', onExit);
