import React from 'react';
import config from '../config';
import { useGlobal } from 'reactn';
import { Camera } from './components/Camera.jsx';

export function SurveillanceMonitor() {
  const [ debugMode ] = useGlobal('debugMode');
  const [ showOverlay ] = useGlobal('showOverlay');

  return (
    <div id="camera-container">
      {config.cameras.sort((a, b) => a.name.localeCompare(b.name)).map((camera, index) => {
        return <Camera 
          debugMode={!!debugMode}
          showOverlay={!!showOverlay}
          camera={camera}
          id={index}
          key={index}
        />;
      })}
    </div>
  );
}
