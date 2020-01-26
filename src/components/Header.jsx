import React, { useState } from 'react';
import { GoGear } from 'react-icons/go';
import { IoMdAdd } from 'react-icons/io';
import { IconContext } from 'react-icons';
import { SettingsModal } from './SettingsModal.jsx';
import { CameraSettingsModal } from './CameraSettingsModal.jsx';

export function Header () {
  const [settingsModalIsOpen, setSettingsModalIsOpen] = useState(false);
  const [addCameraModalIsOpen, setAddCameraModalIsOpen] = useState(false);

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
      />
      <CameraSettingsModal 
        isOpen={addCameraModalIsOpen}
        setIsOpen={setAddCameraModalIsOpen}
      />
    </React.Fragment>
  );
}
