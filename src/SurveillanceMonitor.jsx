import React, { useEffect, useState } from 'react';
import config from '../config';
import { getGlobal } from 'reactn';
import { Camera } from './components/Camera.jsx';

export function SurveillanceMonitor(props) {
  const [debugMode, setDebugMode] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const global = getGlobal();
    setDebugMode(global.debugMode);
    setShowOverlay(global.showOverlay);
  }, [getGlobal()]);

  return (
    <div id="camera-container">
      {config.cameras.sort((a, b) => a.name.localeCompare(b.name)).map((camera, index) => {
        return <Camera 
          debugMode={debugMode}
          showOverlay={showOverlay}
          camera={camera}
          id={index}
          key={index}
        />;
      })}
    </div>
  );
}
