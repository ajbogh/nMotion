import express from 'express';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import bodyParser from 'body-parser';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import flatGlob from 'flatten-glob';
import { getConfig, getConfigSync, getUTCDate } from './util.mjs';
import { getOutputPath, getRecordingPath } from './util.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 3000;
const app = express();

app.use(bodyParser.json());

// serve static assets normally
// app.use(express.static(__dirname + '/public'));
const cameraRecordProcesses = {};

app.get('/api/record/:cameraName', (req, res) =>{
  console.log('-----record camera', req.params);
  const { cameraName } = req.params;
  const name = decodeURIComponent(cameraName);
  const config = getConfigSync();
  const date = new Date();

  if(cameraRecordProcesses[name]) {
    res.sendStatus(201);
    return;
  }

  const outputPath = getOutputPath(config, name, __dirname);
  const filePath = `${outputPath}/${date.toISOString()}.avi`;
  console.log(`Recording to ${filePath}`);

  fs.mkdirSync(outputPath, { recursive: true });

  cameraRecordProcesses[name] = ffmpeg(`http://localhost:8000/live/${encodeURIComponent(cameraName)}.flv`)
    .videoCodec('libx264')
    .videoBitrate('1024k')
    .audioCodec('aac')
    .duration(config.maximumRecordingSeconds) // force stop after MAX seconds.
    .on('error', function(err) {
      if(err.message.indexOf('SIGKILL') > -1) {
        // normal kill process
        return;
      }
      console.log(`An error occurred: ${err.message}`, err);
    })
    .on('end', function() {
      console.log(`Saved recording to ${filePath}`);
    })
    .save(filePath);
  
  res.sendStatus(200);
});

app.get('/api/record/:cameraName/stop', (req, res) =>{
  console.log('-----stop record camera', req.params);
  const { cameraName } = req.params;
  const name = decodeURIComponent(cameraName);
  if(cameraRecordProcesses[name]){
    cameraRecordProcesses[name].kill();
    delete cameraRecordProcesses[name];
    res.sendStatus(200);
    return;
  }

  res.sendStatus(404);
});

app.get('/api/config', async (req, res) =>{
  const config = await getConfig();
  res.json(config);
});

app.post('/api/config', async (req, res) =>{
  const config = getConfigSync();

  // don't just write the body to the file, use a JSON object for safety
  const newConfig = { 
    ...config, 
    ...req.body 
  };
  fs.writeFile('./config.json', JSON.stringify(newConfig, null, 2), (err) => {
    if(err) {
      console.log(err);
      res.status(400).send(err);
    } else {
      console.log("Config updated!");
      res.json(newConfig);
    }
  });
});

app.post('/api/config/camera/:cameraName', async (req, res) =>{
  var cameraName = req.params.cameraName;
  const config = getConfigSync();

  const cameraIndex = config.cameras.findIndex(camera => camera.name === cameraName);
  const camera = {
    ...req.body
  };

  if(cameraIndex === -1) {
    config.cameras.push(camera);  
  } else {
    config.cameras[cameraIndex] = camera;
  }

  fs.writeFile('./config.json', JSON.stringify(config, null, 2), (err) => {
    if(err) {
      console.log(err);
      res.status(400).send(err);
    } else {
      console.log("Config updated!");
      res.json(config);
    }
  });
});

app.delete('/api/config/camera/:cameraName', async (req, res) =>{
  var cameraName = req.params.cameraName;
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
      res.status(400).send(err);
    } else {
      console.log("Config updated!");
      res.json(config);
    }
  });
});

// all recordings
app.get('/api/recordings', async (req, res) => {
  const { page, limit, cameraName, yearUTC, monthUTC, dayUTC } = req.query;
  const config = getConfigSync();

  // convert yearUTC-monthUTC-dayUTC to local server time
  // should it be startTime-endTime instead?
  let selectedDate = getUTCDate(yearUTC, monthUTC, dayUTC);
  //remove the date
  const recordingPath = getRecordingPath(config, __dirname);

  flatGlob([`${recordingPath}/**/*.avi`], function (error, files) {
    files = files.map(file => file.replace(recordingPath, ''));
    res.json({files});
  });
});

app.get('/videos/:cameraName/:year/:month/:day/:filename', async (req, res) => {
  const { cameraName, year, month, day, filename } = req.params;
  const config = getConfigSync();
  const outputPath = getRecordingPath(config, __dirname);
  
  res.sendFile(`${cameraName}/${year}/${month}/${day}/${filename}`, { root: outputPath });
});

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
