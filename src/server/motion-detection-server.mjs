import ffmpeg from 'fluent-ffmpeg';
import P2J from 'pipe2jpeg';
import FileOnWrite from 'file-on-write';
import getPixels from 'get-pixels';
import fetch from 'node-fetch';
import Debug from 'debug';
import config from '../../config.json';
import { findMotionFromRGBA, MOTION_DETECTION_INTERVAL } from '../lib/util.mjs';

const debug = Debug('motion-detection-server');

var writer = new FileOnWrite({ 
  path: './recordings',
  ext: '.jpg'
});

if(!config.cameras) {
  console.error('Error: There are no cameras configured. Use the website to add cameras.');
  process.exit(1);
}

function startCamera(camera, iteration = 0) {
  let isRecording = false;
  if(iteration === 5) {
    console.log(`Error: camera ${camera.name} failed to start too many times. You will need to restart the server.`);
    return;
  }

  const p2j = new P2J();
  const command = ffmpeg(`rtmp://localhost/live/${encodeURIComponent(camera.name)}`)
  .format('mjpeg')
  .noAudio()
  .on('start', (commandLine) => {
    console.log('Spawned Ffmpeg with command: ' + commandLine);
    iteration = 0;
  })
  .on('error', (err) => {
    console.log(err.message);
    process.exit(1);
  })
  .on('end', function() {
    console.log(`Processing finished! This may happen when the camera disconnects. Restarting camera ${camera.name}.`);
    setTimeout(() => {
      startCamera(camera, iteration + 1);
    }, 5000);
  });

  const ffstream = command.pipe();
  let lastTimeChecked = new Date();
  p2j.on('jpeg', (jpeg) => {
    const currentTime = new Date();
    const timeDiff = currentTime.getTime() - lastTimeChecked.getTime();

    if (
      timeDiff >= camera.motionDetectionInterval || 
      timeDiff >= config.motionDetectionInterval || 
      timeDiff > MOTION_DETECTION_INTERVAL
    ) {
      getPixels(jpeg, 'image/jpeg', (err, pixels) =>{
        if(err) {
          debug('getPixels: bad image', err.message);
          return;
        }
    
        const rgba = [...pixels.data];
        const motionDataRGBA = [...pixels.data];
        const { motionDetected,  numBrightPix } = findMotionFromRGBA(rgba, motionDataRGBA, camera);
    
        if(motionDetected && !isRecording) {
          debug(`----motion detected on camera ${camera.name}: ${numBrightPix}`);
          fetch(`http://localhost:5000/record/${encodeURIComponent(camera.name)}`).then(() => {
            isRecording = true;
            setTimeout(() =>{
              fetch(`http://localhost:5000/record/${encodeURIComponent(camera.name)}/stop`).then(() =>{
                isRecording = false;
              }).catch(() =>{
                console.log(
                  `Error: Could not stop recording  for ${camera.name} due to a network error.The recording process will still stop automatically by itself.`, 
                  err
                );
              });
            }, (camera.minimumRecordingSeconds || config.minimumRecordingSeconds || MINIMUM_RECORDING_SECONDS) * 1000)
          }).catch((err) => {
            console.log(`Error: Could not start recording  for ${camera.name} due to a network error.`, err);
          });
          
        }
      });
    }

    lastTimeChecked = currentTime;
  });

  ffstream.pipe(p2j);
}

config.cameras.forEach((camera) => {
  startCamera(camera);
});
