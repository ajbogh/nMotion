import fs, { promises as fsPromise } from 'fs';
import path  from 'path';
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
