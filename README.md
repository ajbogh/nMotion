# nMotion

A motion detection system written in NodeJS which can connect to several RTSP streams and detect movement. The system will store mp4s in a folder called "video", which can be a symlink to any file system.

## Installation

Dependencies: npm, git, ffmpeg, vlc

```bash
git clone git@github.com:ajbogh/nMotion.git
npm install
```

Edit the config.json file to include your cameras. 
Please leave the ports and options alone. You can change the options later as you become accustomed to ffmpeg options. 
Please do not include the `dst` option in the `'--sout', '#transcode{...` line, this is added automatically based on the port number specified.

## Running the app

```bash
node app.js

#to debug
DEBUG=ffmpeg-stream node app.js
```

or 

```bash
npm run app
```

Take note of the console logs and any errors that may occur from VLC or ffmpeg.

**Additional testing/debugging:**

- If VLC couldn't connect then you may either have a misconfiguration in the config.json file, or the camera may be down. Some cameras require a username and password, so try connecting to it from VLC first using your camera's RTSP address. Once connected with VLC, you can use that address in the config.

- To resolve this error: `Error: Cannot find module './build/Debug/buffertools.node'` run the following command.

```
npm rebuild
```