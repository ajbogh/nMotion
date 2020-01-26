import React from 'react';
import config from '../config';
import { Camera } from './components/Camera.jsx';

export function SurveillanceMonitor({debugMode, showOverlay}) {
  console.log(debugMode, showOverlay);

  return (
    <div id="camera-container">
      {config.cameras.sort((a, b) => a.name.localeCompare(b.name)).map((camera, index) => {
        return <Camera 
          showOverlay={showOverlay}
          camera={camera}
          id={index}
          key={index}
          debugMode={debugMode}
        />;
      })}
    </div>
  );
}
