import React, { useEffect } from 'react';
import Modal from 'react-modal';
import { useGlobal } from 'reactn';
import { useSessionStorageState } from 'react-storage-hooks';
import { render } from 'react-dom';
import { BrowserRouter as Router, Route} from 'react-router-dom';
import { SurveillanceMonitor } from './SurveillanceMonitor.jsx';
import { VideoHistory } from './VideoHistory.jsx';
import { Header } from './components/Header.jsx';

// required for browser
const audioContext = new AudioContext();

const appElement = document.getElementById('app');
Modal.setAppElement(appElement);

export function AppRoutes() {
  const [debugMode] = useGlobal('debugMode');
  const [showOverlay] = useGlobal('showOverlay');

  return (
    <Router>
      <div>
        <Header />
        <Route exact path="/">
          <SurveillanceMonitor debugMode={Number(sessionStorage.debugMode)} showOverlay={showOverlay} />
        </Route>
        <Route exact path="/history">
          <VideoHistory />
        </Route>
      </div>
    </Router>
  );
}

render(<AppRoutes />, appElement);
