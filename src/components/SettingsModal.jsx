import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { useSessionStorageState } from 'react-storage-hooks';
import { 
  MINIMUM_RECORDING_SECONDS, 
  PIXEL_SCORE_THRESHOLD, 
  DEFAULT_BRIGHTNESS_THRESHOLD, 
  MAXIMUM_RECORDING_SECONDS,
  MOTION_DETECTION_INTERVAL,
  DEFAULT_RECORDING_PATH
} from '../lib/util.mjs';

export function SettingsModal (props) {
  const { isOpen, setIsOpen } = props;
  const [config, setConfig] = useState();
  const [debugMode, setDebugMode] = useSessionStorageState('debugMode', false);
  const [showOverlay, setShowOverlay] = useSessionStorageState('showOverlay', false);

  const saveConfig = async () => {
    sessionStorage.debugMode = debugMode;
    sessionStorage.showOverlay = showOverlay;

    const response = await (await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    })).json();

    setIsOpen(false);

    return response;
  };

  const saveDebugMode = (isChecked) => {
    setDebugMode(isChecked);
  };

  const saveShowOverlay = (isChecked) => {
    setShowOverlay(isChecked);
  };

  useEffect(() =>{
    const fetchData = async () => {
      setDebugMode(sessionStorage.debugMode || false);
      setShowOverlay(sessionStorage.showOverlay || false);

      const result = await (await fetch('/api/config')).json();
      setConfig(result);
    };
    fetchData();
  }, []);

  useEffect(() => {
    console.log(config);
  }, [config])

  return (
    <Modal 
      isOpen={isOpen}
      onRequestClose={() => setIsOpen(false)}
      style={{
        content : {},
        overlay: {
          zIndex: 1000,
          backgroundColor: 'rgba(30, 30, 30, 0.65)',
        }
      }}
    >
      <button 
        className="btn btn-primary close-button"
        style={{
          position: 'absolute',
          right: 0,
          top: 0
        }}
        onClick={() => setIsOpen(false)}
      >
        &times;
      </button>
      <div className="header">
        <h1>Global Settings</h1>
      </div>
      <div className="settings-modal-content">
        <label>Debug Mode</label>
        <input 
          type="checkbox" 
          checked={debugMode} 
          onChange={(event) => saveDebugMode(event.currentTarget.checked)} 
        />
        <label>Motion Overlay</label>
          <input 
            type="checkbox" 
            disabled={!debugMode}
            checked={showOverlay}
            onChange={(event) => saveShowOverlay(event.currentTarget.checked)}
          />
        
        <label>Brightness Threshold</label>
        <input 
          type="number" 
          value={(config && config.brightnessThreshold) || DEFAULT_BRIGHTNESS_THRESHOLD}
          onChange={event => { 
            setConfig({
              ...config,
              brightnessThreshold: event.currentTarget.valueAsNumber
            });
          }}
        />
        <label>Pixel Score Threshold</label>
        <input 
          type="number"
          value={(config && config.pixelScoreThreshold) || PIXEL_SCORE_THRESHOLD}
          onChange={event => { 
            setConfig({
              ...config,
              pixelScoreThreshold: event.currentTarget.valueAsNumber
            });
          }}
        />
        <label>Min Recording Seconds</label>
        <input 
          type="number" 
          value={(config && config.minimumRecordingSeconds) || MINIMUM_RECORDING_SECONDS}
          onChange={event => { 
            setConfig({
              ...config,
              minimumRecordingSeconds: event.currentTarget.valueAsNumber
            });
          }}
        />
        <label>Max Recording Seconds</label>
        <input 
          type="number"
          value={(config && config.maximumRecordingSeconds) || MAXIMUM_RECORDING_SECONDS}
          onChange={event => { 
            setConfig({
              ...config,
              maximumRecordingSeconds: event.currentTarget.valueAsNumber
            });
          }}
        />
        <label>Motion Detection Interval</label>
        <input 
          type="number" 
          value={(config && config.motionDetectionInterval) || MOTION_DETECTION_INTERVAL}
          onChange={event => { 
            setConfig({
              ...config,
              motionDetectionInterval: event.currentTarget.valueAsNumber
            });
          }}
        />
        <label>Recording path</label>
        <div>
          <input 
            type="text" 
            value={(config && config.recordingPath) || DEFAULT_RECORDING_PATH}
            style={{ width: '100%' }}
            onChange={event => { 
              const value = event.currentTarget.value;
              if(value.indexOf('../') === 0){
                // reject folder traversal in first position
                return;
              }

              setConfig({
                ...config,
                recordingPath: value
              });
            }}
          />
          <div>
            This is the absolute or relative path to a folder on this website's server.<br />
            Example 1: './recordings' is a relative path to '/home/user/Subfolder/nMotion/recordings'.<br />
            Example 2: '/home/user/Security' is an absolute path to the Security folder in a user directory.
          </div>
        </div>
      </div>
      <div className="buttons" style={{ 
        bottom: 0, 
        position: 'absolute', 
        paddingBottom: '18px', 
        width: 'calc(100% - 36px)' 
      }}>
        <button 
          className="save-button" 
          style={{ float: 'right' }}
          onClick={saveConfig}
        >
          Save
        </button>
      </div>
    </Modal>
  );
}
