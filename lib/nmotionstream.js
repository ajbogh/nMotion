var Motion = require("motion-detect").Motion;
var decode = require('im-decode');
var TimedQueue = require('ttq');
var util = require('util');

function NMotionStream(options) {
  options = options || {};

  this.minimumMotion = options.minimumMotion || 2;
  this.sendAllFrames = !!options.sendAllFrames;

  // this.prebuf = (options.prebuffer || 4) + this.minimumMotion;
  // this.postbuf = options.postbuffer || 4;

  this.frames = [];
  this.cacheSeconds = options.cacheSeconds || 5;
  this.inputFPS;

  // this.preframes = [];
  // this.postframes = [];

  this.nomotion = true;
  this.foundMotion = false;

  this.resolution = options.resolution;
  this.interval = options.interval || 1000;

  this.motionStarted = false;
  this.ticks = 0;

  this.queue = new TimedQueue({
    asyncTest: true,
    interval: this.interval,
    success: this.queueSuccess,
    fail: this.queueFail,
    test: this.queueTest,
    context: this
  });

  this.motion = new Motion({
    threshold: options.threshold,
    minChange: options.minChange
  });

  this.readable = true;
  this.writable = true;
};
util.inherits(NMotionStream, require('stream'));

/**
 *  TimeTestQueue test callback to determine whether motion was found
 *  in the array of frames 
 *  @param {Array.<Object>} frames
 *  @param {Function(Boolean)} done
 */
NMotionStream.prototype.queueTest = function(frames, done) {
  //safety shortcut for missing frames
  if (!frames || frames.length < 1) {
    process.nextTick(function() { done(false); });
    return;
  }

  //this caches some number of frames up front
  this.frames = this.frames.concat(frames);
  this.inputFPS = frames.length;

  //now we can test the frames.
  //add this frame to the stack.
  //this.frames.push(frames[0]);

  //find middle frame and detect
  console.log("T", frames.length, this.frames.length);
  decode(frames[0].data, this.resolution, (function(err, img) {
    if (err) return done(false);
    //console.log(this.motion.detect(img));
    var motionDetected = this.motion.detect(img);
    if(!this.motionStarted && motionDetected){
      //trim frames to the first cacheSeconds amount
      this.frames = this.frames.slice(Math.max(this.frames.length - (this.cacheSeconds * this.inputFPS), 1))
      this.motionStarted = motionDetected;
      console.log("continuing");
      //continue buffering
      done(false);
    }else if(
      (
        this.motionStarted && 
        !motionDetected && 
        this.ticks >= this.cacheSeconds - 1
      ) ||
      ( 
        this.motionStarted && 
        this.frames.length > this.inputFPS * 30
      )
    ){
      //send file
      console.log("sending");
      this.motionStarted = false;
      this.ticks = 0;
      done(true);
    }else {
      //no motion detected in more than one set of frames
      //shift the first frame from the stack
      console.log("frames before slice", this.frames.length);
      if(this.frames.length > this.inputFPS * 30){
        this.frames = this.frames.slice(frames.length);
        console.log("frames after slice", this.frames.length);
      }
      
      this.ticks = ++this.ticks % this.cacheSeconds;
      console.log("no motion");
      done(false);
    }
  }).bind(this));

};

/**
 *  On TimeTestQueue fail, cache frames as the prebuffer 
 *  @param {Array.<Object>} frames
 */
NMotionStream.prototype.queueFail = function(frames) {
  console.log("QF");
  // if (this.postBuffering()) {
  //   frames.forEach(this.sendFrame, this);
  // } else {
  //   this.cacheFrames(frames);
  // }
  // this.foundMotion = 0;
};

NMotionStream.prototype.cacheFrames = function(frames) {
  this.preframes.unshift(frames);
  this.preframes = this.preframes.slice(0, this.prebufferCap());
};

/**
 *  Get the prebuffer size
 *  @return {Number} 
 */
NMotionStream.prototype.prebufferCap = function() {
  return Math.max(Math.floor(this.prebuf*1000 / this.interval), 1);
};

/**
 *  On TimeTestQueue success, write frames with any prebuffered frames
 *  @param {Array.<Object>} frames
 */
NMotionStream.prototype.queueSuccess = function(frames) {
  console.log("QS");
  if(this.frames.length >= this.cacheSeconds * this.inputFPS){
    this.sendComplete(this.frames);
    this.frames = [];
  }

  // if (++this.foundMotion >= this.minimumMotion) {
  //   this.withPrebuffer(frames).forEach(function(frame){
  //     frame.frames = this.withPrebuffer(frames)
  //     this.sendFrame(frame)
  //   }, this);

  //   this.sendComplete(this.withPrebuffer(frames));

  //   // clear the frame cache
  //   this.preframes.length = 0;  
  // } else {
  //   this.cacheFrames(frames);
  // }
  // this.nomotion = 0;
};

/**
 *  Concat frames onto prebuffer frames
 *  @param {Array.<Object>} frames
 *  @return {Array.<Object>}
 */
NMotionStream.prototype.withPrebuffer = function(frames) {
  return [].concat.apply([], this.preframes.slice(0).reverse()).concat(frames);
};

/**
 *  Concat frames onto postbuffer frames
 *  @param {Array.<Object>} frames
 *  @return {Array.<Object>}
 */
NMotionStream.prototype.withPostbuffer = function(frames) {
  return frames.concat(this.postframes);
};

/**
 *  Send frames along
 *  @param {Array.<Object>} frames
 */
NMotionStream.prototype.sendFrame = function(frame) {
  this.emit('data', frame);
};

NMotionStream.prototype.sendComplete = function(frames) {
  this.emit('complete', frames);
};

/**
 *  A quick test whether we should write failed frames as a postbuffer
 *  @return {Boolean}
 */
NMotionStream.prototype.postBuffering = function() {
  // This test makes sure
  // 1. motion was found
  // 2. our time without motion is less than or equal to the postbuffer time
  return this.foundMotion > 1 
      && (++this.nomotion * this.interval) <= (this.postbuf * 1000);
};

/** 
 *  Take the passed in image and store it in an object with the current time
 *  @param {Buffer} image
 */
NMotionStream.prototype.write = function(image) {
  this.queue.push({ data: image, time: Date.now() });
};

NMotionStream.prototype.end = function(chunk) {
  this.writable = false;
};

NMotionStream.prototype.destroy = function() {
  this.writable = false;
};

module.exports = NMotionStream;