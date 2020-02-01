import React, { useRef, useEffect, useState } from 'react';
import { useInterval } from '../lib/hooks.mjs';
import config from '../../config.json';
import { 
  getMotionData, 
  hasMotion, 
  drawImageData, 
  copyVideoToCanvas, 
  startRecording,
  MOTION_DETECTION_INTERVAL
} from '../lib/util.mjs';

export function MotionDetection ({ id, videoRef, camera, imageDataCallback, debugMode }) {
  const debugMotionRef = useRef();
  const [isRecording, setIsRecording] = useState(false);
  const recordingTimeoutRef = useRef();
  const breakImmediately = false;
  const useBinaryColor = false;
  let motionData;
  
  useEffect(() => {
    const context = debugMotionRef.current.getContext('2d');
    context.imageSmoothingEnabled = true;
  }, []);

  // capture motion interval
  useInterval(() => {
    copyVideoToCanvas(videoRef.current, debugMotionRef.current);
    motionData = getMotionData(debugMotionRef.current, camera, breakImmediately, useBinaryColor);
    
    drawImageData(motionData.imageData, debugMotionRef.current);
    
    if(hasMotion(motionData.numBrightPix, camera)){
      // pass the image data back up to parent
      imageDataCallback(motionData.motionData);

      // start recording
      startRecording(camera, isRecording, setIsRecording, recordingTimeoutRef);
    }
  }, camera.motionDetectionInterval || config.motionDetectionInterval || MOTION_DETECTION_INTERVAL);

  return <canvas 
    id={`camera-${id}`}
    ref={debugMotionRef}
    width={640}
    height={360}
    data-key={id}
    style={{ 
      minWidth: '640px', 
      minHeight: '360px',
      display: debugMode ? 'block' : 'none'
    }}
  />;
}
