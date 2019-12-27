import React from 'react';
import { render } from 'react-dom';
import config from '../config';
import queryString from 'query-string';
import { Camera } from './components/Camera.jsx';

class SurveillanceMonitor extends React.Component {
  constructor(props) {
    super(props);
    this.canvasTimeouts = {};
    this.lastImageData = [];
    this.state = {
      showOverlay: false,
      toggledCamera: null,
      debugMode: true,
      camerasPaused: false,
    };

    this.audioContext = new AudioContext();

    this.queryObject = queryString.parse(location.search);
    this.state.debugMode = this.queryObject.debug !== undefined;
    this.state.showOverlay = this.queryObject.showOverlay !== undefined;

    document.addEventListener('visibilitychange', () => {
      this.setState({
        camerasPaused: document.hidden && document.visibilityState === 'hidden',
      });
    });

    // ["", "webkit", "moz", "ms"].forEach(
    //   prefix => document.addEventListener(prefix+"fullscreenchange", this.checkFullScreenVideo.bind(this), false)
    // );
  }
  
  // checkFullScreenVideo () {
  //   if (!window.screenTop && !window.screenY) {
  //     return;
  //   }

  //   console.log('fullscreen');
  // }

  render(){
    const { camerasPaused, toggledCamera, showOverlay, debugMode } = this.state;
    return (
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
    );
  }
}

render(<SurveillanceMonitor />, document.getElementById('app'));
