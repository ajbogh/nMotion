import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import config from '../../config.json';
import { 
  DEFAULT_BRIGHTNESS_THRESHOLD, 
  PIXEL_SCORE_THRESHOLD, 
  MINIMUM_RECORDING_SECONDS, 
  MAXIMUM_RECORDING_SECONDS, 
  MOTION_DETECTION_INTERVAL
} from '../lib/util';

export function CameraSettingsModal (props) {
  const { isOpen, setIsOpen, camera } = props;
  const [cameraConfig, setCameraConfig] = useState();

  const saveConfig = async () => {
    console.log('----saveConfig', config);
    const newCameraConfig = {
      ...cameraConfig
    };

    // Remove values that match the global setting or are blank
    for (let [key, value] of Object.entries(newCameraConfig)) {
      console.log(config[key], value);
      if((config[key] === value) || (config[key] && !value)) {
        delete newCameraConfig[key];
      }
    }

    return await (await fetch(`/api/config/camera/${camera.name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newCameraConfig)
    })).json();
  };

  useEffect(() =>{
    setCameraConfig({...camera});
  }, []);

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
        className="close-button"
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
      <h1>{(cameraConfig && cameraConfig.name) || ''} Settings</h1>
      </div>
      <div className="settings-modal-content">
        <label>Camera Name</label>
        <input 
          type="text" 
          value={cameraConfig && cameraConfig.name}
          onChange={event => { 
            setCameraConfig({
              ...cameraConfig,
              name: event.currentTarget.value
            });
          }}
        />
        <label>Camera Stream URL</label>
        <input 
          type="text" 
          value={cameraConfig && cameraConfig.url}
          onChange={event => { 
            setCameraConfig({
              ...cameraConfig,
              url: event.currentTarget.value
            });
          }}
        />
        <label>Brightness Threshold</label>
        <input 
          type="number" 
          value={(cameraConfig && cameraConfig.brightnessThreshold) || config.brightnessThreshold || DEFAULT_BRIGHTNESS_THRESHOLD}
          onChange={event => { 
            setCameraConfig({
              ...cameraConfig,
              brightnessThreshold: event.currentTarget.valueAsNumber
            });
          }}
        />
        <label>Pixel Score Threshold</label>
        <input 
          type="number"
          value={(cameraConfig && cameraConfig.pixelScoreThreshold) || config.pixelScoreThreshold || PIXEL_SCORE_THRESHOLD}
          onChange={event => { 
            setCameraConfig({
              ...cameraConfig,
              pixelScoreThreshold: event.currentTarget.valueAsNumber
            });
          }}
        />
        <label>Min Recording Seconds</label>
        <input 
          type="number" 
          value={(cameraConfig && cameraConfig.minimumRecordingSeconds) || config.minimumRecordingSeconds || MINIMUM_RECORDING_SECONDS}
          onChange={event => { 
            setCameraConfig({
              ...cameraConfig,
              minimumRecordingSeconds: event.currentTarget.valueAsNumber
            });
          }}
        />
        <label>Max Recording Seconds</label>
        <input 
          type="number"
          value={(cameraConfig && cameraConfig.maximumRecordingSeconds) || config.maximumRecordingSeconds || MAXIMUM_RECORDING_SECONDS}
          onChange={event => { 
            setCameraConfig({
              ...cameraConfig,
              maximumRecordingSeconds: event.currentTarget.valueAsNumber
            });
          }}
        />
        <label>Motion Detection Interval</label>
        <input 
          type="number" 
          value={(cameraConfig && cameraConfig.motionDetectionInterval) || config.motionDetectionInterval || MOTION_DETECTION_INTERVAL}
          onChange={event => { 
            setCameraConfig({
              ...cameraConfig,
              motionDetectionInterval: event.currentTarget.valueAsNumber
            });
          }}
        />
        <label>Custom FFMPEG Options (space separated)</label>
        <input
          type="text" 
          placeholder="Example: -c:v libx264 -f rawvideo -fflags +nobuffer+flush_packets"
          value={cameraConfig && cameraConfig.ffmpegOptions && cameraConfig.ffmpegOptions.join(' ')}
          onChange={event => { 
            setCameraConfig({
              ...cameraConfig,
              ffmpegOptions: event.currentTarget.value !== '' ? event.currentTarget.value.split(' ') : undefined
            });
          }}
          style={{ maxHeight: '2em' }}
        />
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
