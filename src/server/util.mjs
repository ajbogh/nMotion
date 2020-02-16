import fs, { promises as fsPromise } from 'fs';
import path  from 'path';
import { spawn } from 'child_process';
import Canvas from 'canvas';
import { DEFAULT_RECORDING_PATH } from '../lib/util.mjs';

export async function getConfig() {
  return fsPromise.readFile('./config.json').then(JSON.parse);
}

export function getConfigSync() {
  const configString = fs.readFileSync('./config.json');
  return JSON.parse(configString);
}

export function getUTCDate (yearUTC, monthUTC, dayUTC) {
  let selectedDate = new Date(0);

  if (yearUTC) {
    selectedDate.setUTCFullYear(parseInt(yearUTC, 10));

    if (monthUTC) {
      // month starts at 0 in JS, we pass 1-based month
      selectedDate.setUTCMonth(parseInt(monthUTC, 10) - 1);

      if (dayUTC) {
        selectedDate.setUTCDate(parseInt(dayUTC, 10));
      }
    }
  }

  return selectedDate;
}

export function getOutputPath(config, cameraName, dirname) {
  const date = new Date();
  // Note: these date values ignore UTC dates and only return local dates. 
  // It works well when the server is in the same timezone (most situations), 
  // but it will show the wrong date sometimes when the server is in a different timezone.
  // We can fix this by setting the date to UTC first, but then it could confuse the user.
  // Perhaps a global setting in the future could ask for a desired timezone and use that.
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const recordingPath = config.recordingPath || DEFAULT_RECORDING_PATH;
  let outputPath = '';

  console.log(cameraName, dirname);
  
  if(recordingPath.indexOf('./') === 0) {
    // relative path
    outputPath = path.resolve(
      dirname, 
      '../../'
    );
    outputPath += `${recordingPath.replace(/^\.\//, '/')}/${cameraName}/${year}/${month}/${day}`
  } else {
    // absolute path
    outputPath = path.resolve( 
      recordingPath
    );

    // if it doesn't resolve the directory then use the default path instead
    if(outputPath === path.resolve(dirname)){
      outputPath = path.resolve(
        dirname, 
        '../../'
      );
      outputPath += `${DEFAULT_RECORDING_PATH.replace(/^\.\//, '/')}`;
    }
    outputPath += `/${cameraName}/${year}/${month}/${day}`
  }
  return outputPath;
}

export function getRecordingPath(config, dirname) {
  const outputPath = getOutputPath(config, 'all', dirname);
  const outputPathArr = outputPath.split('/')
  //remove the date and camera name
  return outputPathArr.slice(0, outputPathArr.length - 4).join('/');
}

export function updateConfig(config) {
  return fsPromise.writeFile('./config.json', JSON.stringify(config, null, 2))
    .then((err) => {
      if(err) {
        console.log(err);
        res.status(400).send(err);
      } else {
        console.log("Config updated!");
        res.json(config);
      }
    });
}

export function camerasMediaServer() {
  let proc = null;
  const commands = {
    start: () => {
      commands.stop();
      proc = spawn('node', [
        '--experimental-modules', 
        '--experimental-json-modules',
        './src/server/cameras-media-server.js'
      ], {
        stdio: [process.stdin, process.stdout, process.stderr]
      });
    },
    stop: () => {
      if(!proc) {
        return;
      }

      proc.kill();
      proc = null;
    },
    restart: () => {
      commands.stop();
      commands.start();
    }
  };

  return commands;
}

export function rtmpMediaServer() {
  let proc = null;
  const commands = {
    start: () => {
      commands.stop();
      proc = spawn('node', [
        '--experimental-modules', 
        '--experimental-json-modules',
        './src/server/rtmp-media-server.js'
      ], {
        stdio: [process.stdin, process.stdout, process.stderr]
      });
    },
    stop: () => {
      if(!proc) {
        return;
      }

      proc.kill();
      proc = null;
    },
    restart: () => {
      commands.stop();
      commands.start();
    }
  };

  return commands;
}

export function motionDetectionServer() {
  let proc = null;
  let timeout;
  const commands = {
    start: () => {
      commands.stop();
      if(timeout) {
        clearTimeout(timeout);
      }
      console.log('------ Waiting 10 seconds before starting the motion detection server.');
      timeout = setTimeout(() => {
        timeout = null;
        console.log('------ Spawning motion detection server now...');
        proc = spawn('node', [
          '--experimental-modules', 
          '--experimental-json-modules', 
          './src/server/forking-motion-detection.mjs'
        ], {
          stdio: [process.stdin, process.stdout, process.stderr]
        });
      }, 10000);
    },
    stop: () => {
      if(!proc) {
        return;
      }

      proc.kill();
      proc = null;
    },
    restart: () => {
      commands.stop();
      commands.start();
    }
  };

  return commands;
}
