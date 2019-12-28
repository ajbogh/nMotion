import React from 'react';
import Modal from 'react-modal';
import { render } from 'react-dom';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { SurveillanceMonitor } from './SurveillanceMonitor.jsx';

// required for browser
const audioContext = new AudioContext();

const appElement = document.getElementById('app');
Modal.setAppElement(appElement);

export function AppRoutes() {
  return (
    <Router>
      <div>
        <Route exact path="/">
          <SurveillanceMonitor />
        </Route>
      </div>
    </Router>
  );
}

render(<AppRoutes />, appElement);
