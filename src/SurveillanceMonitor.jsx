import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IconContext } from 'react-icons';
import { GoGear } from 'react-icons/go';
import { IoMdAdd } from "react-icons/io";
import config from '../config';
import queryString from 'query-string';
import { Camera } from './components/Camera.jsx';
import { SettingsModal } from './components/SettingsModal.jsx';
import { CameraSettingsModal } from './components/CameraSettingsModal.jsx';

export function SurveillanceMonitor(props) {
  const queryObject = queryString.parse(location.search);
  const [settingsModalIsOpen, setSettingsModalIsOpen] = useState(false);
  const [addCameraModalIsOpen, setAddCameraModalIsOpen] = useState(false);
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

  return (
    <React.Fragment>
      <div className="app-header">
        <div className="right-icons">
          <IconContext.Provider value={{ color: 'white' }}>
            <IoMdAdd 
              className="add-camera icon" 
              title="Add Camera"
              onClick={() => setAddCameraModalIsOpen(true)} 
            />
          </IconContext.Provider>
          <IconContext.Provider value={{ color: 'white' }}>
            <GoGear 
              className="settings-gear icon" 
              title="Global Settings"
              onClick={() => setSettingsModalIsOpen(true)} 
            />
          </IconContext.Provider>
        </div>
      </div>
      <SettingsModal 
        isOpen={settingsModalIsOpen}
        setIsOpen={setSettingsModalIsOpen}
        toggleDebugMode={toggleDebugMode}
        toggleShowOverlay={toggleShowOverlay}
        showOverlay={showOverlay}
        debugMode={debugMode}
      />
      <CameraSettingsModal 
        isOpen={addCameraModalIsOpen}
        setIsOpen={setAddCameraModalIsOpen}
      />
      <div id="container">
        {config.cameras.map((camera, index) => {

          return <Camera 
            showOverlay={showOverlay}
            camera={camera}
            id={index}
            key={index}
            debugMode={debugMode}
          />;
        })}
      </div>
    </React.Fragment>
  );
}
