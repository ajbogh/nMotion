const respawn = require('respawn');
const config = require('../../config.json');
const WAIT_TIME = 5000;

function setupCameraMessages (camera, cameraProc, cameraSuccesses) {
  cameraProc.on('stderr', (data) => {
    if(cameraSuccesses[camera.name]) {
      return;
    }

    const message = data.toString();
    console.error(camera.name, message);

    if(message.indexOf('frame=') > -1){
      cameraSuccesses[camera.name] = true;
      console.error(`${camera.name} successfully started, quieting output.`);
    }
  });

  cameraProc.on('stdout', (data) => {
    console.log(camera.name, data.toString());
  });
}

function startCameraProc(ffmpegOptions, camera) {
  const cameraProc = respawn(['ffmpeg', ...ffmpegOptions], {
    name: camera.name, // set monitor name
    cwd: '.',          // set cwd
    maxRestarts: -1,   // how many restarts are allowed within 60s
                       // or -1 for infinite restarts
    sleep: 1000,       // time to sleep between restarts,
    // kill: 30000,    // wait 30s before force killing after stopping
    fork: false        // fork instead of spawn
  });
  cameraProc.start();
  return cameraProc;
}

function getCameraFFMPEGOptionArray(camera) {
  return (
    camera.overrideAllFFMPEGOptions ? 
    [
      ...(camera.ffmpegOptions || [])
    ] : 
    [
      '-hide_banner',
      '-hwaccel', 'auto',
      '-i', camera.url,
      '-threads', 4,
      // '-b:v', '800k',
      // '-r', '30',
      // '-c:v', 'libx264',
      // '-c:a', 'aac',
      '-c:v', 'copy',
      '-c:a', 'copy',
      // '-profile:v', 'main',
      ...(camera.ffmpegOptions || [])
    ]
  );
}

function startFLVProcess(camera) {
  const cameraOptions = [
    ...getCameraFFMPEGOptionArray(camera),
    '-f', 'flv', `rtmp://localhost/live/${encodeURIComponent(camera.name)}`
  ];

  console.log(`Using command: ffmpeg ${cameraOptions.join(' ')}`);

  const cameraProc = startCameraProc(cameraOptions, camera);
  const cameraSuccesses = {};

  setupCameraMessages(camera, cameraProc, cameraSuccesses);
}

function startHLSProcess(camera) {
  const cameraOptions = [
    '-use_wallclock_as_timestamps', '1',
    ...getCameraFFMPEGOptionArray(camera),
    '-hls_flags', 'delete_segments', `./public/live/${camera.name}-hls.m3u8`
  ];

  console.log(`Using command: ffmpeg ${cameraOptions.join(' ')}`);

  const cameraProc = startCameraProc(cameraOptions, camera);
  const cameraSuccesses = {};

  setupCameraMessages(camera, cameraProc, cameraSuccesses);
}

console.log(`Waiting ${(WAIT_TIME/1000).toFixed(2)} seconds before starting the cameras...`);
setTimeout(() => {
  if(config.useHLSStreams) {
    console.log('-----Starting HSL Processes');
    config.cameras.forEach(startHLSProcess);
  } else {
    console.log('-----Starting FLV Processes');
    config.cameras.forEach(startFLVProcess);
  }
}, WAIT_TIME);

