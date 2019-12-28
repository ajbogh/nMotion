import React, { useState } from 'react';
import Modal from 'react-modal';
import { useHistory } from 'react-router-dom';
import { IconContext } from 'react-icons';
import { GoGear } from 'react-icons/go';
import config from '../config';
import queryString from 'query-string';
import { Camera } from './components/Camera.jsx';

export function SurveillanceMonitor(props) {
  const queryObject = queryString.parse(location.search);
  const [settingsModalIsOpen, setSettingsModalIsOpen] = useState(false);
  const [camerasPaused, setCamerasPaused] = useState(false);
  const [showOverlay, setShowOverlay] = useState(queryObject.showOverlay !== undefined);
  const [debugMode, setDebugMode] = useState(queryObject.debug !== undefined || undefined);
  const history = useHistory();

  const toggleDebugMode = (isDebug) => {
    queryObject.debug = isDebug ? true : undefined;
    history.push({
      pathname: '/',
      search: queryString.stringify(queryObject),
    });
    setDebugMode(isDebug);
  };

  const toggleShowOverlay = (showOverlay) => {
    queryObject.showOverlay = showOverlay ? true : undefined;
    history.push({
      pathname: '/',
      search: queryString.stringify(queryObject),
    });
    setShowOverlay(showOverlay);
  };
  

  document.addEventListener('visibilitychange', () => {
    setCamerasPaused(document.hidden && document.visibilityState === 'hidden');
  });

  return (
    <React.Fragment>
      <IconContext.Provider value={{ color: 'white' }}>
        <GoGear onClick={() => setSettingsModalIsOpen(true)} />
      </IconContext.Provider>
      <Modal 
        isOpen={settingsModalIsOpen}
        onRequestClose={() => setSettingsModalIsOpen(false)}
      >
        <div>
          <label>Debug Mode:{' '}
            <input 
              type="checkbox" 
              checked={debugMode} 
              onChange={(event) => toggleDebugMode(event.currentTarget.checked)} 
            />
          </label>
        </div>
        <div>
          <label>Motion Overlay:{' '}
            <input 
              type="checkbox" 
              checked={showOverlay}
              onChange={(event) => toggleShowOverlay(event.currentTarget.checked)}
            />
          </label>
        </div>
      </Modal>
      <div id="container">
        {config.cameras.map((camera, index) => {

          return <Camera 
            showOverlay={showOverlay}
            camera={camera}
            id={index}
            key={index}
            debugMode={debugMode}
            play={!camerasPaused}
          />;
        })}
      </div>
    </React.Fragment>
  );
}
