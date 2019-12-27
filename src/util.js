/**
* https://www.adobe.com/devnet/archive/html5/articles/javascript-motion-detection.html
* vvvvv
*/
export function fastAbs(value) {
 // equivalent to Math.abs();
 return (value ^ (value >> 31)) - (value >> 31);
}

export function difference(target, data1, data2) {
  // blend mode difference
  if (data1.length != data2.length) return null;
  var i = 0;
  while (i < (data1.length * 0.25)) {
    target[4*i] = data1[4*i] == 0 ? 0 : fastAbs(data1[4*i] - data2[4*i]);
    target[4*i+1] = data1[4*i+1] == 0 ? 0 : fastAbs(data1[4*i+1] - data2[4*i+1]);
    target[4*i+2] = data1[4*i+2] == 0 ? 0 : fastAbs(data1[4*i+2] - data2[4*i+2]);
    target[4*i+3] = 0xFF;
    ++i;
  }
}

export function differenceAccuracy(target, data1, data2) {
  if (data1.length != data2.length) return null;
  var i = 0;
  while (i < (data1.length * 0.25)) {
    var average1 = (data1[4*i] + data1[4*i+1] + data1[4*i+2]) / 3;
    var average2 = (data2[4*i] + data2[4*i+1] + data2[4*i+2]) / 3;
    var diff = threshold(fastAbs(average1 - average2));
    target[4*i] = diff;
    target[4*i+1] = diff;
    target[4*i+2] = diff;
    target[4*i+3] = 0xFF;
    ++i;
  }
}

export function threshold(value) {
  return (value > 0x15) ? 0xFF : 0;
}

export function checkAreas(canvasSource, contextBlended, key) {
  // get the pixels in a note area from the blended image
  var blendedData = contextBlended.getImageData(0, 0, canvasSource.width, canvasSource.height);
  var i = 0;
  var average = 0;
  // loop over the pixels
  while (i < (blendedData.data.length / 4)) {
    // make an average between the color channel
    average += (blendedData.data[i*4] + blendedData.data[i*4+1] + blendedData.data[i*4+2]) / 3;
    ++i;
  }
  // calculate an average between of the color values of the note area
  average = Math.round(average / (blendedData.data.length / 4));
  if (average > 10) {
    // over a small limit, consider that a movement is detected
    console.log("Motion detected on camera", key, new Date());
  }
}
