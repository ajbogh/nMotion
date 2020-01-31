import React, { useEffect, useState } from 'react';
import config from '../config';

export function VideoHistory() {
  const [recordings, setRecordings] = useState({ files: [] });

  useEffect(async () => {
    const recordingsResult = await (await fetch('/api/recordings')).json();
    setRecordings(recordingsResult);
  }, []);

  return (
    <div id="history-container">
      {config.cameras.sort((a, b) => a.name.localeCompare(b.name)).map((camera, index) => {
        return <div key={index}>{camera.name}</div>;
      })}
      <ul>
        {recordings.files.map((recordingPath, index) => {
          return <li key={index}><a href={`/videos${recordingPath}`}>{recordingPath}</a></li>;
        })}
      </ul>
    </div>
  );
}
