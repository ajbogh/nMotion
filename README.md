# nMotion

nMotion is a video camera viewer and motion detection system written in NodeJS and React. It can connect to several different webcam systems using FFMpeg, including RTSP streams, USB webcams, or mpegts streams (to name a few) and detect movement. The system will store mp4s in a folder configured in the settings screen, or by default in a folder called "recordings", which can be a symlink to any file system.

The goal of nMotion is to be easy to configure, flexible, and to never complicate motion detection.

Each camera includes its own settings screen to modify the default settings for that particular camera. This includes adding additional ffmpeg settings to help in connecting to some of the more pesky video cameras.

Adding and removing cameras can be done through the website and is very easy.

nMotion includes a debug mode to visualize how the motion detection system "sees" motion.

![Motion Detection Debugger](https://raw.githubusercontent.com/ajbogh/nMotion/master/wiki_resources/images/Motion%20Debug%20Example.png)

## Installation

```bash
git clone git@github.com:ajbogh/nMotion.git
npm install
```

- Copy `config.json.template` to `config.json`
- Start the server

## Running the app

The start command will run the camera service and the website at the same time.

```bash
npm run start
```

The website can be viewed by opening http://localhost:5000, the URL will be copied to the clipboard automatically.

Take note of the console logs and any errors that may occur from ffmpeg during the startup process. Any camera that doesn't connect may require additional ffmpeg options. The ffmpeg command used to start each camera is reported in the terminal when the service starts.

Within the website you can add or remove any camera, or modify other system settings using the settings modals.

