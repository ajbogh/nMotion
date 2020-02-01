import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { useInterval } from '../lib/hooks.mjs';
import config from '../../config.json';
import { IconContext } from 'react-icons';
import { GoGear } from 'react-icons/go';
import classNames from 'classnames';
import Fullscreen from "react-full-screen";
import { exitFullScreen, MOTION_DETECTION_INTERVAL, requestFullScreen } from '../lib/util.mjs';
import flvjs from 'flv.js';
import { MotionDetection } from './MotionDetection.jsx';
import { CameraSettingsModal } from './CameraSettingsModal.jsx';

export function Camera(props) {
  const { camera, id, debugMode, showOverlay } = props;
  const [imageData, setImageData] = useState();
  const [isFull, setIsFull] = useState();
  const [settingsModalIsOpen, setSettingsModalIsOpen] = useState(false);
  const videoRef = useRef();
  const videoSourceRef = useRef();
  const overlayRef = useRef();
  const url = `http://localhost:8000/live/${encodeURIComponent(camera.name)}.flv`;
  var flvPlayer = flvjs.createPlayer({
    type: 'flv',
    isLive: true,
    enableWorker: true,
    autoCleanupSourceBuffer: true,
    url
  });
  flvPlayer.on('ERROR', console.log);
  
  // Load video effect
  useEffect(() => {
    flvPlayer.attachMediaElement(videoRef.current);

    videoRef.current.addEventListener('pause', () => {
      flvPlayer.unload();
    });

    videoRef.current.addEventListener('play', () => {
      flvPlayer.load();
      videoRef.current.play();
    });

    flvPlayer.load();
    flvPlayer.play();
  }, []);

  useEffect(() => {
    if(!overlayRef.current || !imageData) {
      return;
    }
    
    const overlayCanvasContext = overlayRef.current.getContext('2d');
    overlayCanvasContext.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);

    // show the motion on the video
    overlayCanvasContext.putImageData(imageData, 0, 0);
  }, [imageData]);

  // capture motion interval
  useInterval(() => {
    if(!overlayRef.current) {
      return;
    }
    
    const overlayCanvasContext = overlayRef.current.getContext('2d');
    overlayCanvasContext.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
  }, camera.motionDetectionInterval || config.motionDetectionInterval || MOTION_DETECTION_INTERVAL);

  return (
    <React.Fragment>
      <div style={{ position: 'relative' }}>
        <Fullscreen 
          enabled={isFull}
          data-key={id}
          onChange={isFull => {
            // hack
            const fullscreenVideoElem = document.querySelector('.fullscreen-enabled > video');
            
            if (!isFull && fullscreenVideoElem && fullscreenVideoElem.id === camera.name) {
              exitFullScreen();
              setIsFull(isFull);
            } else if (isFull && !fullscreenVideoElem) {
              exitFullScreen();
              setIsFull(false);
            } else {
              setIsFull(isFull);
            }
          }}
        >
          <CameraSettingsModal 
            isOpen={settingsModalIsOpen}
            setIsOpen={setSettingsModalIsOpen}
            debugMode={debugMode}
            camera={camera}
          />
          <div style={{ display: 'inline-block', position: 'relative' }}>
            <IconContext.Provider value={{ color: 'white' }}>
              <GoGear 
                className="settings-gear" 
                style={{ position: 'absolute', right: 0, top: 0, zIndex: 10 }}
                title={`${camera.name} Settings`}
                onClick={(event) => {
                  event.preventDefault();
                  setSettingsModalIsOpen(true);
                }} 
              />
            </IconContext.Provider>
            <video id={camera.name} 
              className={
                classNames('video-js', 'vjs-default-skin', {
                  full: isFull
                })
              } 
              ref={videoRef}
              autoPlay={true}
              controls={false} 
              preload="auto" 
              poster="images/ajax-loader.gif"
              width={640}
              height={360}
              onClick={() => requestFullScreen(videoRef.current)}
              muted={true}
              style={{
                width: isFull ? '100%' : '640px',
                height: isFull ? '100%' : '360px',
              }}
            >
              <source 
                ref={videoSourceRef}
                src={`http://localhost:8000/live/${encodeURIComponent(camera.name)}.flv`} 
                type="video/flv" 
              />
            </video>
          </div>
        </Fullscreen>
        {debugMode && showOverlay && (
          <canvas 
            id={`camera-${id}Overlay`}
            width={640}
            height={360}
            ref={overlayRef}
            data-key={id}
            onClick={() => setIsFull(true)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
        )}
      </div>
      
      <MotionDetection 
        videoRef={videoRef}
        id={id}
        debugMode={debugMode}
        camera={camera}
        imageDataCallback={(imageData) => {
          setImageData(imageData);
        }}
      />
    </React.Fragment>
  );
}
