import React, { useEffect } from 'react';
import Modal from 'react-modal';
import { setGlobal, useGlobal } from 'reactn';
import queryString from 'query-string';
import { render } from 'react-dom';
import { BrowserRouter as Router, Route} from 'react-router-dom';
import { SurveillanceMonitor } from './SurveillanceMonitor.jsx';
import { VideoHistory } from './VideoHistory.jsx';
import { Header } from './components/Header.jsx';

// required for browser
const audioContext = new AudioContext();

const appElement = document.getElementById('app');
Modal.setAppElement(appElement);

setGlobal({
  debugMode: false,
  showOverlay: false,
});

export function AppRoutes() {
  const [debugMode] = useGlobal('debugMode');
  const [showOverlay] = useGlobal('showOverlay');

  return (
    <Router>
      <div>
        <Header />
        <Route exact path="/">
          <SurveillanceMonitor debugMode={debugMode} showOverlay={showOverlay} />
        </Route>
        <Route exact path="/history">
          <VideoHistory />
        </Route>
      </div>
    </Router>
  );
}

render(<AppRoutes />, appElement);
