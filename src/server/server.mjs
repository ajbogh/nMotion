import express from 'express';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import bodyParser from 'body-parser';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import flatGlob from 'flatten-glob';
import { getConfig, getConfigSync, getUTCDate } from './util.mjs';
import { getOutputPath } from './util.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 3000;
const app = express();

app.use(bodyParser.json());

// serve static assets normally
// app.use(express.static(__dirname + '/public'));
const cameraRecordProcesses = {};

app.get('/record/:cameraName', (request, response) =>{
  console.log('-----record camera', request.params);
  const { cameraName } = request.params;
  const name = decodeURIComponent(cameraName);
  const config = getConfigSync();
  const date = new Date();

  if(cameraRecordProcesses[name]) {
    response.sendStatus(201);
    return;
  }

  const outputPath = getOutputPath(config, name, __dirname);
  const filePath = `${outputPath}/${date.toISOString()}.avi`;
  console.log(`Recording to ${filePath}`);

  fs.mkdirSync(outputPath, { recursive: true });

  cameraRecordProcesses[name] = ffmpeg(`http://localhost:8000/live/${cameraName}.flv`)
    .videoCodec('libx264')
    .videoBitrate('1024k')
    .audioCodec('aac')
    .duration(config.maximumRecordingSeconds) // force stop after MAX seconds.
    .on('error', function(err) {
      if(err.message.indexOf('SIGKILL') > -1) {
        // normal kill process
        return;
      }
      console.log('An error occurred: ' + err.message);
    })
    .on('end', function() {
      console.log(`Saved recording to ${filePath}`);
    })
    .save(filePath);
  
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

app.get('/api/config', async (request, response) =>{
  const config = await getConfig();
  response.json(config);
});

app.post('/api/config', async (request, response) =>{
  const config = getConfigSync();

  // don't just write the body to the file, use a JSON object for safety
  const newConfig = { 
    ...config, 
    ...request.body 
  };
  fs.writeFile('./config.json', JSON.stringify(newConfig, null, 2), (err) => {
    if(err) {
      console.log(err);
      response.status(400).send(err);
    } else {
      console.log("Config updated!");
      response.json(newConfig);
    }
  });
});

app.post('/api/config/camera/:cameraName', async (request, response) =>{
  var cameraName = request.params.cameraName;
  const config = getConfigSync();

  const cameraIndex = config.cameras.findIndex(camera => camera.name === cameraName);
  const camera = {
    ...request.body
  };

  if(cameraIndex === -1) {
    config.cameras.push(camera);  
  } else {
    config.cameras[cameraIndex] = camera;
  }

  fs.writeFile('./config.json', JSON.stringify(config, null, 2), (err) => {
    if(err) {
      console.log(err);
      response.status(400).send(err);
    } else {
      console.log("Config updated!");
      response.json(config);
    }
  });
});

app.delete('/api/config/camera/:cameraName', async (request, response) =>{
  var cameraName = request.params.cameraName;
  const config = getConfigSync();

  const cameraIndex = config.cameras.findIndex(camera => camera.name === cameraName);
  
  if(cameraIndex === -1) {
    return
  } else {
    config.cameras.splice(cameraIndex, 1);
  }

  fs.writeFile('./config.json', JSON.stringify(config, null, 2), (err) => {
    if(err) {
      console.log(err);
      response.status(400).send(err);
    } else {
      console.log("Config updated!");
      response.json(config);
    }
  });
});

// all recordings
app.get('/api/recordings', async (request, response) =>{
  const { page, limit, cameraName, yearUTC, monthUTC, dayUTC } = request.query;
  const config = getConfigSync();

  // convert yearUTC-monthUTC-dayUTC to local server time
  // should it be startTime-endTime instead?
  let selectedDate = getUTCDate(yearUTC, monthUTC, dayUTC);
  const outputPath = getOutputPath(config, 'all', __dirname);
  const outputPathArr = outputPath.split('/')
  const recordingPath = outputPathArr.slice(0, outputPathArr.length - 4).join('/');
  console.log(recordingPath);

  flatGlob([`${recordingPath}/**/*.avi`], function (error, files) {
    // const config = await getConfig();
    // response.json(config.cameras);
    response.json({files});
  });
});

// Handles all routes so you do not get a not found error
// app.get('*', function (request, response){
//     response.sendFile(path.resolve(__dirname, 'public', 'index.html'))
// });

const server = app.listen(port);
console.log("============= Express server started on port " + port);

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
