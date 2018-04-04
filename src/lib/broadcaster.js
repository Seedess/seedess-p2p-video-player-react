import MediaStreamRecorder from 'msr'
import EventEmitter from 'events'

EventEmitter.defaultMaxListeners = 0 // prevent warnings. TODO: remove and fix

const global = global || window
const WebTorrent = global.WebTorrent
const debug = require('debug')('torrent-video-player:lib/broadcaster')

export default class Broadcaster extends EventEmitter {
  
  /**
   *  opts {
   *    recordInterval: the Interval that the webcam recording should seed each segment of the video
   *    recordInterval: interval to record video at (in ms)
   *    videoEl: video element to play broadcasters local video stream
   *  }
   */
  constructor( opts ) {
    
    super()
    
    const defaultOpts = {
      recordInterval: 1000,
      maxSeeds: 20,
      videoEl: null
    }
    
    this.opts = Object.assign(defaultOpts, opts)
    
    debug('new Broadcaster', this.opts)

    this.stream = null
    
    this.seedQueue = []

    this.$video = this.opts.videoEl || document.createElement('video')
    this.$video.defaultMuted = true

    this.startBroadcast = this.startBroadcast.bind(this)
    this.stopBroadcast = this.stopBroadcast.bind(this)
    this.broadCasting = false
    
    this.broadcaster = new WebTorrent({ dht: false })
    this.broadcastId = this.opts.broadcastId || this.broadcaster.peerId
    
    this.mediaRecorder = null
    
    this.chunkNum = 0
  }
  
  getBroadcastId() {
    return this.broadcastId
  }
  
  // TODO: Fix recorder stops after a few seconds
  recordStream(stream) {
    let mediaRecorder = this.mediaRecorder = new MediaStreamRecorder(stream)
    // record a blob every _recordInterval amount of time
    debug('mediaRecorder start', this.opts.recordInterval)
    mediaRecorder.start(this.opts.recordInterval)
    mediaRecorder.mimeType = 'video/webm'

    // every _recordInterval, make a new torrent file and start seeding it
    mediaRecorder.ondataavailable = (blob) => {
      var chunkNum = this.chunkNum++

      debug('Recorded data available', blob, chunkNum)

      this.emit('recorded', blob, chunkNum)

      const file = new File([blob], `torcdn-broadcast-${chunkNum}.webm`, {
        type: 'video/webm'
      })

      this.addFileToSeedQueue(file, chunkNum)

    }
  }
  
  startBroadcast(videoEl, stream, mediaConstraints) {
      this.$video = videoEl || this.$video
      var $video = this.$video
      
      this.broadCasting = true
      
      debug('Starting broadcast', $video)

      const onMediaSuccess = (stream) => {
        this.stream = stream
        this.recordStream(stream)

        let createSrc = (global.URL) ? global.URL.createObjectURL : stream => stream

        // play back the recording to the broadcaster
        $video.src = createSrc(stream)
        $video.onloadedmetadata = (e) => {
          this.$video.defaultMuted = true
          $video.play()
        }
        
        debug('Playing user media stream', stream)
      }

      const onMediaError = (e) => {
        debug('media error', e);
      }
      
      mediaConstraints = Object.assign({
        audio: true,
        video: true
      }, mediaConstraints || {})
    
      stream ? onMediaSuccess(stream) : navigator.getUserMedia(mediaConstraints, onMediaSuccess, onMediaError)
  }
  
  stopBroadcast() {
    
    this.broadCasting = false

    // Pause the video
    this.$video.pause();

    // stops the the audio and video from recording
    this.stream.getTracks().forEach((track) => track.stop())

    // destroys the broadcasting client and starts back at the beginning
    return // TODO: remove
    this.broadcaster.destroy( () => {
      debug('All torrents destroyed')
    })
  }
  
  addFileToSeedQueue(file, chunkNum) {
    debug('Adding file to seed queue', file, this.seedQueue)
    const opts = {
      //announceList: [['https://tracker.torcdn.com/announce']],
      announce: ['wss://tracker.torcdn.com'],
      private: true,
      dht: false
    }
    this.broadcaster.seed(file, opts, (torrent) => {
      torrent.on('wire', function (wire) {
        debug('New wire', wire)
      })
      this.seedQueue.push({file: file, torrent: torrent})
      debug('Added torrent to seed queue ', torrent.magnetURI)
      this.broadcastSeedToPeers(torrent.magnetURI, chunkNum)
      if (this.seedQueue.length > this.opts.maxSeeds) {
        debug('Destroying seed', seed)
        var seed = this.seedQueue.shift()
        seed.torrent.destroy()
      }
    })
  }

  // just emit an event, let listeners choose how to send to peers
  broadcastSeedToPeers(magnetURI, chunkNum) {
    debug('Broadcasting magnet', magnetURI, chunkNum)
    this.emit('magnetURI', {chunkNum: chunkNum, magnetURI: magnetURI})
  }
  
  
}