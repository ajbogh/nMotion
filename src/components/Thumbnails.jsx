import React from 'react';

export function Thumbnails ({files}) {
  return (
    <div>
      {files.map(file => {
        return <li>file</li>;
      })}
    </div>
  );
}
