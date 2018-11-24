import React from 'react';
import { render } from 'react-dom';
import * as config from '../config.json';


class SurveillanceMonitor extends React.Component {
  renderCamera(camera, key){
    return (
      <video key={key} width="320" height="240" controls src={`http://localhost:${camera.webStreamPort}`}>
        Your browser doesn't support this form of streaming video.
      </video>
    );
  }

  renderCameras() {
    return config.cameras.map((camera, index) => {
      return this.renderCamera(camera, index);
    });
  }

  render(){
    // Render JSX
    return (
      <div>
        {this.renderCameras()}
      </div>
    );
  }
}
render(<SurveillanceMonitor />, document.getElementById('container'));
