# nMotion

A motion detection system written in NodeJS which can connect to several RTSP streams and detect movement. The system will store mp4s in a folder called "recordings", which can be a symlink to any file system.

## Installation

```bash
git clone git@github.com:ajbogh/nMotion.git
npm install
```

- Copy `config.json.template` to `config.json`

Edit the config.json file to include your cameras and ffmpegOptions. See the [ffmpeg documentation](https://ffmpeg.org/ffmpeg.html) for more advanced options.

Create a symlink for the "recordings" folder. You may link this folder to any file system or location within the target computer.

## Running the app

The start command will run the camera service and the website at the same time.

```bash
npm run start
```

The website can be viewed by opening http://localhost:5000, the URL will be copied to the clipboard automatically.

Take note of the console logs and any errors that may occur from ffmpeg during the startup process. Any camera that doesn't connect may require additional ffmpeg options. The ffmpeg command used to start each camera is reported in the terminal when the service starts.
