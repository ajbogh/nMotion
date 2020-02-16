import { findMotionFromRGBA } from '../../src/lib/util.mjs';
import assert from 'assert';

describe('findMotionFromRGBA function', () => {
  it('modifies the array with green-based motion values', () => {
    const rgba = [ 0, 30, 10, 255, 255, 255, 255, 255 ];
    const motionDataRGBA = [];

    // make copies for assertions
    const originalRGBA = [...rgba];
    const originalMotionDataRGBA = [...motionDataRGBA];
    const camera = {
      name: 'fake'
    };

    // stores first run
    findMotionFromRGBA(rgba, motionDataRGBA, camera, false);

    assert.deepEqual(originalRGBA, rgba);
    assert.deepEqual(originalMotionDataRGBA, motionDataRGBA);

    // run once more to modify
    rgba[0] = 255;
    rgba[1] = 255;
    rgba[2] = 255;
    findMotionFromRGBA(rgba, motionDataRGBA, camera, false);

    assert.notDeepEqual(originalRGBA, rgba);
    assert.notDeepEqual(originalMotionDataRGBA, motionDataRGBA);
    
    // red full because motion, green partial, alpha 255
    assert.deepEqual(rgba, [255, 236, 0, 255, 0, 0, 0, 255]);
    assert.deepEqual(motionDataRGBA, [255, 236, 0, 255, 0, 0, 0, 0]);
  });
});
