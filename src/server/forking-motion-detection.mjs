import { fork } from 'child_process';

import config from '../../config.json';

if(!config.cameras) {
  console.error('motion-detection-server: Error: There are no cameras configured. Use the website to add cameras.');
  process.exit(1);
}

config.cameras.forEach((camera) => {
  const forked = fork(`src/server/camera-motion-detector.mjs`);

  // This is how we would listen to a message from the child.
  // forked.on('message', (msg) => {
  //   console.log('Message from child', msg);
  // });

  // Sending a message immediately doesn't work. Need to wait a few ms for the process to spin up.
  setTimeout(() =>{
    forked.send({ camera: camera.name });
  }, 100);
});
