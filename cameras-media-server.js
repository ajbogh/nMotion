const respawn = require('respawn');
const config = require('./config');
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

function startFLVProcess(camera) {
  let commonOptions = [
    '-hide_banner',
    '-hwaccel', 'auto',
    '-i', camera.url,
    '-threads', 2,
    // '-b:v', '800k',
    // '-r', '30',
    // '-c:v', 'libx264',
    // '-c:a', 'aac',
    '-c:v', 'copy',
    '-c:a', 'copy',
    // '-profile:v', 'main',
    ...(camera.ffmpegOptions || [])
  ];

  let smallVidOptions = [
    ...commonOptions,
    // scale and copy options can't be used together.
    // '-vf', 'scale=w=640:h=360',
    '-f', 'flv', `rtmp://localhost/live/${encodeURIComponent(camera.name)}`
  ];

  console.log(`Using command: ffmpeg ${smallVidOptions.join(' ')}`);

  // const largeVidOptions = [
  //   ...commonOptions,
  //   '-vf', 'scale=w=1280:h=1024',
  //   '-f', 'flv', `rtmp://localhost/live/${encodeURIComponent(camera.name)}-full`
  // ];

  const cameraProc = respawn(['ffmpeg', ...smallVidOptions], {
    name: camera.name, // set monitor name
    cwd: '.',          // set cwd
    maxRestarts: -1,   // how many restarts are allowed within 60s
                       // or -1 for infinite restarts
    sleep: 1000,       // time to sleep between restarts,
    // kill: 30000,    // wait 30s before force killing after stopping
    fork: false        // fork instead of spawn
  });
  cameraProc.start()
  // const largeCameraProc = spawn('ffmpeg', largeVidOptions);
  const cameraSuccesses = {};

  setupCameraMessages(camera, cameraProc, cameraSuccesses);
}

// function startHLSProcess(camera) {
//   const commonOptions = [
//     '-hide_banner',
//     '-i', camera.url,
//     '-c:v', 'libx264',
//     '-b:v', '800k',
//     '-r', '30',
//     '-c:a', 'aac',
//     '-vf', 'scale=w=640:h=360',
//     '-profile:v', 'main',
//     '-maxrate', '400k', '-bufsize', '1835k',
//     '-g', 48, 
//     '-keyint_min', 48,
//     '-sc_threshold', 0,
//     '-f', 'hls', 
//     '-flags', '-global_header',
//     '-hls_time', 10, 
//     '-hls_list_size', 6,
//     '-hls_wrap', 10,
//     '-start_number', 1,
//     '-hls_delete_threshold', 1,
//     '-hls_flags', 'delete_segments',
//     '-hls_playlist_type', 'vod', 
//     '-segment_list_flags', '+live',
//     `./public/streams/stream_${encodeURIComponent(camera.name)}.m3u8`,
//     // '-f', 'flv', `rtmp://localhost/live/${encodeURIComponent(camera.name)}`
//   ];

//   const cameraProc = spawn('ffmpeg', commonOptions);
//   // const largeCameraProc = spawn('ffmpeg', largeVidOptions);
//   const cameraSuccesses = {};

//   setupCameraMessages(camera, cameraProc, cameraSuccesses);
// }

console.log(`Waiting ${(WAIT_TIME/1000).toFixed(2)} seconds before starting the cameras...`);
setTimeout(() => {
  config.cameras.forEach(startFLVProcess);
  // config.cameras.forEach(startHLSProcess);
}, WAIT_TIME);

