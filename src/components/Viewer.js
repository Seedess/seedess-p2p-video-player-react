import React from 'react'
import EventedComponent from '../lib/evented-component'
import Viewer from '../lib/viewer'

const debug = require('debug')('torrent-video-player:Viewer')

const INITIAL_STATE = {
  torrent: null,
  progress: 0,
  numPeers: 0,
  downloadSpeed: 0,
  downloaded: 0
}

export default class VideoViewer extends EventedComponent {

  state = INITIAL_STATE

  constructor(props) {
    super(props)
    this.videoRef = this.videoRef.bind(this)
    this.loadingRef = this.loadingRef.bind(this)
    this.removeVideoPlayer = this.removeVideoPlayer.bind(this)
    
    this.broadcastId = this.props.broadcastId
    
    this.Viewer = new Viewer()
    
    this.Emitter = this.props.Emitter || this
    
    this.Emitter.on('magnetURI', magnetURI => this.Viewer.emit('magnetURI', magnetURI))
    
    debug('props', this.props)
    
  }

  removeVideoPlayer(event) {
    event.preventDefault()
    event.stopPropagation()
    const videoEl = this.videoEl
    this.pauseVideo(videoEl)
    videoEl.load()
    this.deleteVideo(videoEl)
    setImmediate(() => this.props.removeVideo())
  }

  setInitialState() {
    this.setState(INITIAL_STATE)
  }

  playVideo() {
    debug('Playing video', this.videoEl)
    this.Viewer.startViewing(this.videoEl)
  }

  isVideoDisplayed() {
    return !!this.videoEl
  }

  isVideoPlaying(video) {
    return !!(!video.paused && !video.ended && video.currentTime > 0 && video.readyState > 2)
  }

  pauseVideo(videoEl) {
    videoEl && videoEl.pause()
  }

  deleteVideo(videoEl) {
    videoEl && videoEl.parentNode.removeChild(videoEl)
    videoEl = null
  }

  addVideoPlayerEvents(videoEl) {
    var loadTimer, 
      buffering,
      loadInterval = 200,
      hasBeenAutoPlayed = false

    videoEl.addEventListener('pause', event => {
      videoEl.paused = true
    })

    videoEl.addEventListener('timeupdate', event => {
      this.loadingEl.style.display = 'none'
      buffering = false

      if (!hasBeenAutoPlayed && !videoEl.paused) {
        videoEl.play() // fix ff autoplay not working
        hasBeenAutoPlayed = true
      }

      clearInterval(loadTimer)
      loadTimer = setInterval(() => {
        if (this.isVideoLoading(videoEl)) {
          this.loadingEl.style.display = 'block'
          this.monitorTorrentStats(this.state.torrent)
        }
      }, loadInterval)
    })
  }

  isVideoLoading(videoEl) {
    return !this.isVideoPlaying(videoEl) && !videoEl.paused
  }

  loadingRef(ref) {
    this.loadingEl = ref
  }

  videoRef(ref) {
    this.videoEl = ref
  }

  render() {
    const video = this.props.video
    return (<div id="video-player-chrome">
        <h2>Viewer {this.broadcastId}</h2>
        <div id="video-player">
          <div className="loading" ref={this.loadingRef}>
            <p><i className="fa fa-circle-o-notch spin" /></p> 
            <p>Loading Video... </p>
            <p>Connected {this.state.numPeers} peers</p>
            <p>Buffered {this.state.progress}%</p>
          </div>
          <video ref={this.videoRef} controls />
        </div>
      </div>)
  }
}
