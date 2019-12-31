import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';

export function SettingsModal (props) {
  const { isOpen, setIsOpen, toggleDebugMode, toggleShowOverlay, debugMode, showOverlay } = props;
  const [config, setConfig] = useState();

  const saveConfig = async () => {
    console.log('----saveConfig', config);
    return await (await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    })).json();
  };

  useEffect(() =>{
    const fetchData = async () => {
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
            disabled={!debugMode}
            checked={showOverlay}
            onChange={(event) => toggleShowOverlay(event.currentTarget.checked)}
          />
        </label>
      </div>
      <div>
        <label>Brightness Threshold:{' '}
          <input 
            type="number" 
            value={config && config.brightnessThreshold}
            onChange={event => { 
              setConfig({
                ...config,
                brightnessThreshold: event.currentTarget.valueAsNumber
              });
            }}
          />
        </label>
      </div>
      <div>
        <label>Pixel Score Threshold:{' '}
          <input 
            type="number"
            value={config && config.pixelScoreThreshold}
            onChange={event => { 
              setConfig({
                ...config,
                pixelScoreThreshold: event.currentTarget.valueAsNumber
              });
            }}
          />
        </label>
      </div>
      <div>
        <label>Minimum Recording Seconds:{' '}
          <input 
            type="number" 
            value={config && config.minimumRecordingSeconds}
            onChange={event => { 
              setConfig({
                ...config,
                minimumRecordingSeconds: event.currentTarget.valueAsNumber
              });
            }}
          />
        </label>
      </div>
      <div>
        <label>Maximum Recording Seconds:{' '}
          <input 
            type="number"
            value={config && config.maximumRecordingSeconds}
            onChange={event => { 
              setConfig({
                ...config,
                maximumRecordingSeconds: event.currentTarget.valueAsNumber
              });
            }}
          />
        </label>
      </div>
      <div>
        <label>Motion Detection Interval:{' '}
          <input 
            type="number" 
            value={config && config.motionDetectionInterval}
            onChange={event => { 
              setConfig({
                ...config,
                motionDetectionInterval: event.currentTarget.valueAsNumber
              });
            }}
          />
        </label>
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
