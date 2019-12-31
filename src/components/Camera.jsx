import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { useInterval } from '../lib/hooks';
import config from '../../config.json';
import classNames from 'classnames';
import Fullscreen from "react-full-screen";
import { requestFullScreen, exitFullScreen } from '../lib/util';
import flvjs from 'flv.js';
import { MotionDetection } from './MotionDetection.jsx';

// update(canvasSource, contextSource, contextBlended, key) {
//   this.blend(canvasSource, contextSource, contextBlended, key);
//   checkAreas(canvasSource, contextBlended, key);
//   requestAnimationFrame(() => {
//     this.update(canvasSource, contextSource, contextBlended, key)
//   });
// }

export function Camera(props) {
  const { camera, id, debugMode, showOverlay, play } = props;
  const [imageData, setImageData] = useState();
  const [isFull, setIsFull] = useState();
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
    flvPlayer.load();
    flvPlayer.play();
  }, []);

  // play/pause effect
  useEffect(() => {
    if (play) {
      console.log(`Calling play for camera ${camera.name}`);
      videoRef.current.play();
    } else {
      console.log(`Calling pause for camera ${camera.name}`);
      videoRef.current.pause();
    }
  }, [play]);

  // fullscreen effect
  useEffect(() => {
    // console.log(isFull, videoRef.current);
    // if (isFull === false && videoRef.current) {
    //   console.log("exiting fullscreen");
    //   exitFullScreen();
    // }
    // if(showOverlay && toggledCamera === id) {
    //   requestFullScreen(videoRef.current);
    // } else if (!showOverlay && toggledCamera === id) {
    //   exitFullScreen(videoRef.current);
    // }
  }, [isFull]);

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
  }, camera.motionDetectionInterval || config.motionDetectionInterval || 500);

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
          <video id={camera.name} 
            className={
              classNames('video-js', 'vjs-default-skin', {
                full: isFull
              })
            } 
            ref={videoRef}
            autoPlay={true}
            controls={true} 
            preload="auto" 
            width={640}
            height={360}
            muted={true}
            style={{
              width: isFull ? '100%' : '640px',
              height: isFull ? '100%' : '360px',
            }}
            // onClick={() => setIsFull(true)}
          >
            <source 
              ref={videoSourceRef}
              src={`http://localhost:8000/live/${encodeURIComponent(camera.name)}.flv`} type="video/flv" 
            />
          </video>
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
              border: '1px solid red',
            }}
          />
        )}
      </div>
      {debugMode && (
        <MotionDetection 
          videoRef={videoRef}
          id={id}
          camera={camera}
          imageDataCallback={(imageData) => {
            setImageData(imageData);
          }}
        />
      )}
    </React.Fragment>
  );
}
