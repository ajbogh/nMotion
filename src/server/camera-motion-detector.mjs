import { basename } from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import P2J from 'pipe2jpeg';
import getPixels from 'get-pixels';
import fetch from 'node-fetch';
import savePixels from 'save-pixels';
import Jimp from 'jimp';
import sharp from 'sharp';
import jpegJS from 'jpeg-js';
import Canvas from 'canvas';
import sizeOf from 'buffer-image-size';
import config from '../../config.json';
import { 
  findMotionFromRGBA, 
  drawImageData, 
  MOTION_DETECTION_INTERVAL 
} from '../lib/util.mjs';
import { getOutputPath } from './util.mjs';

const DEFAULT_WIDTH = 640;
const DEFAULT_HEIGHT = 360;

if(!config.cameras) {
  console.error('camera-motion-detector: Error: There are no cameras configured. Use the website to add cameras.');
  process.exit(1);
}

process.on('message', (msg) => {
  if(msg.camera) {
    // start processing for camera
    console.log(`${basename(process.argv[1])}: Starting processing for camera: ${msg.camera}`);
    const cameraConfig = config.cameras.find((camera) => camera.name === msg.camera);
    if(!cameraConfig) {
      console.log(`${basename(process.argv[1])}: Couldn't find the config for camera: ${msg.camera}`);
    } 

    startCamera(cameraConfig);
  }
  console.log('Message from parent:', msg);
});

let isRecording = false;

async function recordMotion(camera) {
  // if(isRecording === true) {
  //   console.log(`motion-detection-server: ignoring motion, ${camera.name} already recording`);
  //   return Promise.resolve();
  // }

  console.log(`motion-detection-server: Starting recording for ${camera.name}`);
  return fetch(`http://localhost:5000/api/record/${encodeURIComponent(camera.name)}`).then(() => {
    return new Promise((resolve, reject) => {
      console.log(`motion-detection-server: Setting a stop timer for ${camera.name}`, (camera.minimumRecordingSeconds || config.minimumRecordingSeconds || MINIMUM_RECORDING_SECONDS) * 1000);
      setTimeout(() =>{
        console.log(`++++++++motion-detection-server: Stopping recording for ${camera.name}`);
        fetch(`http://localhost:5000/api/record/${encodeURIComponent(camera.name)}/stop`).then(() =>{
          console.log(`motion-detection-server: Successfully finished recording ${camera.name}`);
          isRecording = false;
          resolve();
        }).catch((err) =>{
          console.log(
            `motion-detection-server: Error: Could not stop recording for ${camera.name} due to a network error. The recording process will still stop automatically by itself.`, 
            err
          );
          isRecording = false;
          reject();
        });
      }, (camera.minimumRecordingSeconds || config.minimumRecordingSeconds || MINIMUM_RECORDING_SECONDS) * 1000);
    });
  }).catch((err) => {
    console.log(`motion-detection-server: Error: Could not start recording for ${camera.name} due to a network error.`, err);
    isRecording = false;
  });
}

function startCamera(camera, iteration = 0) {
  if(iteration === 5) {
    console.log(`motion-detection-server: Error: camera ${camera.name} failed to start too many times. You will need to restart the server.`);
    return;
  }

  const p2j = new P2J();
  const command = ffmpeg(`rtmp://localhost/live/${encodeURIComponent(camera.name)}`)
  // .size(`${DEFAULT_WIDTH}x${DEFAULT_HEIGHT}`)
  .format('mjpeg')
  .noAudio()
  .on('start', (commandLine) => {
    console.log('motion-detection-server: Spawned Ffmpeg with command: ' + commandLine);
    iteration = 0;
  })
  .on('error', (err) => {
    console.log(err.message);
    process.exit(1);
  })
  .on('end', function() {
    console.log(`motion-detection-server: Processing finished! This may happen when the camera disconnects. Restarting camera ${camera.name}.`);
    setTimeout(() => {
      startCamera(camera, iteration + 1);
    }, 5000);
  });

  const ffstream = command.pipe();
  let lastTimeChecked = new Date();
  p2j.on('jpeg', async (jpeg) => {
    const currentTime = new Date();
    const timeDiff = currentTime.getTime() - lastTimeChecked.getTime();

    if (
      (timeDiff >= camera.motionDetectionInterval || 
      timeDiff >= config.motionDetectionInterval || 
      timeDiff > MOTION_DETECTION_INTERVAL) && 
      !isRecording
    ) {
      isRecording = true;
      // const size = sizeOf(jpeg);

      // const resizedJpeg = new Jimp({ data: jpeg, width: size.width, height: size.height });
      const resizedJpeg = await sharp(jpeg).resize(
        640,
        360
      ).toBuffer();

      getPixels(resizedJpeg, 'image/jpeg', (err, pixels) =>{
        if(err) {
          console.log('motion-detection-server: getPixels: bad image', err.message);
          isRecording = false;
          return;
        }
    
        const rgba = Array.from(pixels.data);
        const motionDataRGBA = [];
        // motionDataRGBA will be modified
        const { motionDetected, numBrightPix, pixelScoreThreshold } = findMotionFromRGBA(rgba, motionDataRGBA, camera, false);

        if(motionDetected) {
          console.log(`motion-detection-server: motion detected on camera ${camera.name}: ${numBrightPix} of ${pixelScoreThreshold}`);
          const date = new Date();
          
          recordMotion(camera).then(() =>{
            const outputPath = getOutputPath(config, camera.name, basename(process.argv[1]));
            const filePath = `${outputPath}/${date.toISOString()}`;

            const jpegMotionImageData = jpegJS.encode({
              width: DEFAULT_WIDTH,
              height: DEFAULT_HEIGHT,
              data: rgba
            });
            fs.writeFileSync(`${filePath}.jpg`, jpeg, 'base64');
            fs.writeFileSync(`${filePath}_motion.jpg`, jpegMotionImageData.data, 'base64');
          });
        } else {
          isRecording = false;
        }
      });
    }

    lastTimeChecked = currentTime;
  });

  ffstream.pipe(p2j);
}
