import config from '../../config.json';

export const PIXEL_SCORE_THRESHOLD = 60;
export const DEFAULT_BRIGHTNESS_THRESHOLD = 0.15;
export const R_WAVELENGTH_CONTRIBUTION = 0.3;
export const G_WAVELENGTH_CONTRIBUTION = 0.59;
export const B_WAVELENGTH_CONTRIBUTION = 0.11;
export const MINIMUM_RECORDING_SECONDS = 15;
export const MAXIMUM_RECORDING_SECONDS = 30;
export const MOTION_DETECTION_INTERVAL = 500;
export const DEFAULT_RECORDING_PATH = `./recordings`;

// const cameraImageData = {};
const priorImageData = {};

export function getPixelScoreThreshold(camera){
  return camera.pixelScoreThreshold || config.pixelScoreThreshold || PIXEL_SCORE_THRESHOLD;
}

export function copyVideoToCanvas(video, canvas) {
  const context = canvas.getContext('2d');

  let targetWidth = canvas.width; 
  let targetHeight = canvas.height;
  let xOffset = 0

  targetWidth  = (targetHeight * video.videoWidth) / video.videoHeight;
  xOffset = (canvas.width - targetWidth) / 2;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(video, xOffset, 0, targetWidth, targetHeight);
}

// modifies rgba and motionDataRGBA in place
export function findMotionFromRGBA(rgba, motionDataRGBA, camera, breakImmediately=true, useBinaryColor=false) {
  const pixelScoreThreshold = getPixelScoreThreshold(camera);
  const priorCameraImageData = priorImageData[camera.name];
  priorImageData[camera.name] = [...rgba];
  let numBrightPix = 0;

  for (var i = 0; i < rgba.length; i += 4) {
    // Convert to greyscale (greenscale) using the proper wavelength contributions instead of the average method
    var pixelDiff = rgba[i] * R_WAVELENGTH_CONTRIBUTION 
      + rgba[i + 1] * G_WAVELENGTH_CONTRIBUTION 
      + rgba[i + 2] * B_WAVELENGTH_CONTRIBUTION;

    // Convert to greenscale
    rgba[i] = 0;
    rgba[i + 1] = pixelDiff;
    rgba[i + 2] = 0;
    motionDataRGBA[i] = 0;
    motionDataRGBA[i + 1] = 0;
    motionDataRGBA[i + 2] = 0;
    motionDataRGBA[i + 3] = 255;

    if(priorCameraImageData && priorCameraImageData.length) {
      const priorDataDiff = priorCameraImageData[i] * R_WAVELENGTH_CONTRIBUTION 
        + priorCameraImageData[i + 1] * G_WAVELENGTH_CONTRIBUTION 
        + priorCameraImageData[i + 2] * B_WAVELENGTH_CONTRIBUTION;
      
      rgba[i + 1] = rgba[i + 1] - priorDataDiff;
      motionDataRGBA[i + 1] = rgba[i + 1];

      if(rgba[i + 1] > (255 * (camera.brightnessThreshold || config.brightnessThreshold || DEFAULT_BRIGHTNESS_THRESHOLD))) {
        // red full
        rgba[i] = 255;
        motionDataRGBA[i] = rgba[i];

        if (useBinaryColor){
          rgba[i] = 255;
          rgba[i+1] = 255;
          rgba[i+2] = 255;
          motionDataRGBA[i] = rgba[i];
          motionDataRGBA[i+1] = rgba[i+1];
          motionDataRGBA[i+2] = rgba[i+2];
        }
        
        numBrightPix++;
      } else if (useBinaryColor) {
        rgba[i] = 0;
        rgba[i+3] = 0;
        rgba[i + 1] = 0;
        motionDataRGBA[i+3] = 0;
      } else {
        motionDataRGBA[i+3] = 0;
      }
    }
    if(numBrightPix === pixelScoreThreshold && breakImmediately) {
      return { numBrightPix, motionDetected: true };
    }
  }

  let motionDetected = false;
  if(numBrightPix >= pixelScoreThreshold){
    motionDetected = true;
  }

  return  { numBrightPix, motionDetected };
}

export function getMotionData (canvas, camera, breakImmediately=true, useBinaryColor=false) {
  const context = canvas.getContext('2d');
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const rgba = imageData.data;
  const motionImageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const motionDataRGBA = motionImageData.data;

  // modifies rgba and motionDataRGBA in place
  const { numBrightPix } = findMotionFromRGBA(rgba, motionDataRGBA, camera, breakImmediately, useBinaryColor);

  return { 
    numBrightPix, 
    imageData: imageData,
    motionData: motionImageData
  };
}

export function hasMotion(numBrightPix, camera) {
  return numBrightPix >= getPixelScoreThreshold(camera);

}

export function drawImageData(imageData, canvas) {
  let context = canvas.getContext('2d');   

  // clear raw pixels and draw new mono pixels
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.putImageData(imageData, 0, 0);
}

export async function startRecording(camera, isRecording, setIsRecording, recordingTimeoutRef) {
  if (!isRecording) {
    // start the stream capture
    console.log(`Starting recording for camera ${camera.name}`);
    await fetch(`/api/record/${encodeURIComponent(camera.name)}`);
    setIsRecording(true);
  } else if (!recordingTimeoutRef.current) {
    recordingTimeoutRef.current = setTimeout(async () => {
      // save video
      console.log(`Stopping recording for camera ${camera.name}`);
      await fetch(`/api/record/${encodeURIComponent(camera.name)}/stop`);
      setIsRecording(false);
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = undefined;
    }, (camera.minimumRecordingSeconds || config.minimumRecordingSeconds || MINIMUM_RECORDING_SECONDS) * 1000);
  }
}

export function requestFullScreen (vid) {
  if(vid.requestFullScreen){
    vid.requestFullScreen();
  } else if(vid.webkitRequestFullScreen){
    vid.webkitRequestFullScreen();
  } else if(vid.mozRequestFullScreen){
    vid.mozRequestFullScreen();
  }
}

export function exitFullScreen () {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
  }
}
