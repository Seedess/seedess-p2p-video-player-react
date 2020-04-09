//import MediaStreamRecorder from 'msr'
import EventEmitter from 'events'
import DownloadQueue from './DownloadQueue'
import PlayQueue from './PlayQueue'
EventEmitter.defaultMaxListeners = 0 // prevent warnings. TODO: remove and fix

const debug = require('debug')('torrent-video-player:lib/viewer')

export default class Viewer extends EventEmitter {
  
  /**
   *  opts {
   *    infoHash: 20 byte hex string (40 chars) of broadcast ID
   *    videoEl: video element to play broadcasters local video stream
   *  }
   */
  constructor( opts = {} ) {
    
    super()
    
    const defaultOpts = {
      infoHash: null,
      videoEl: null
    }
    
    this.opts = Object.assign(defaultOpts, opts)
    
    debug('new Viewer', this.opts)

    this.stream = null
    
    this.playQueue = new PlayQueue()
    
    this.downloadQueue = new DownloadQueue()
    this.downloadQueue.on('downloaded', torrent => this.playQueue.push(torrent))

    this.$video = this.opts.videoEl || document.createElement('video')

    this.startViewing = this.startViewing.bind(this)
    this.stopViewing = this.stopViewing.bind(this)
    
  }
  
  startViewing(videoEl) {
      var $video = this.$video = videoEl || this.$video
      this.stopped = false
      var stream

      const play = torrent => {
        this.stream = stream = torrent.files[0].createReadStream()
        //let createSrc = (global.URL) ? global.URL.createObjectURL : stream => stream
        debug('stream from torrent', torrent, stream, torrent.files[0])
        // play to file
        torrent.files[0].renderTo($video)
        $video.onloadedmetadata = e => {
          this.emit('ready', $video)
          $video.play()
          this.emit('play', $video)
        }
      }
      
      const getNextPlayQueue = () => {
        this.playQueue.next(torrent => play(torrent))
      }
      
      // just once on start viewing, get from playqueue when a video is pushed to queue
      this.playQueue.once('push', () => getNextPlayQueue())
      // when a video ends, try and get the next in queue
      $video.addEventListener('ended', event => getNextPlayQueue(), false)
    
      this.on('magnetURI', data => {
        this.addMagnetToDownloadQueue(data.magnetURI, data.chunkNum)
      })
  }
  
  stopViewing() {
    
    this.stopped = true

    // Pause the video
    this.$video.pause();


    // destroys the broadcasting client and starts back at the beginning
    this.broadcaster.destroy( () => {
      debug('All torrents destroyed')
    })
  }
  
  addMagnetToDownloadQueue(magnetURI, chunkNum) {
    debug('Adding magnet to queue', magnetURI, this.downloadQueue)
    
    this.downloadQueue.push(magnetURI, chunkNum)
  }
  
}