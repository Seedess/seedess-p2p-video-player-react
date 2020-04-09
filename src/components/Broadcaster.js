import React from 'react'
import EventedComponent from '../lib/evented-component'
import Broadcaster from '../lib/broadcaster'

const debug = require('debug')('torrent-video-player:Broadcaster')

const INITIAL_STATE = {
  torrent: null,
  progress: 0,
  numPeers: 0,
  downloadSpeed: 0,
  downloaded: 0,
  broadCasting: false
}

export default class VideoBroadcaster extends EventedComponent {

  state = INITIAL_STATE

  constructor(props) {
    super(props)
    this.videoRef = this.videoRef.bind(this)
    this.loadingRef = this.loadingRef.bind(this)
    this.removeVideoPlayer = this.removeVideoPlayer.bind(this)
    this.toggleBroadcast = this.toggleBroadcast.bind(this)
    
    this.Broadcaster = new Broadcaster()
    this.broadcastId = this.props.broadcastId || this.Broadcaster.getBroadcastId()
    
    this.Broadcaster.on('magnetURI', magnetURI => {
      this.emit('magnetURI', magnetURI)
    })
    
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
    //debug('Playing video', this.videoEl)
    //this.Broadcaster.startBroadcast(this.videoEl)
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
    var loadTimer, loadInterval = 2000,
      hasBeenAutoPlayed = false

    videoEl.addEventListener('timeupdate', () => {
      this.loadingEl.style.display = 'none'

      clearInterval(loadTimer)
      loadTimer = setInterval(() => {
        if (this.isVideoLoading(videoEl)) {
          this.loadingEl.style.display = 'block'
          this.monitorTorrentStats(this.state.torrent)
        } else {
          if (!hasBeenAutoPlayed) {
            videoEl.play() // fix ff autoplay not working
            hasBeenAutoPlayed = true
          }
          clearInterval(this.torrentStatsUpdateInterval)
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

  toggleBroadcast() {
    if (this.state.broadCasting) {
      this.Broadcaster.stopBroadcast(this.videoEl)
    } else {
      this.Broadcaster.startBroadcast(this.videoEl)
    }
    this.setState({
      broadCasting: this.Broadcaster.broadCasting
    })
  }

  render() {
    const video = this.props.video
    const broadcastStateText = this.state.broadCasting ? 'Stop Broadcast' : 'Start Broadcast'
    return (<div id="video-player-chrome">
        <h3>Broadcast {this.broadcastId}</h3>
        <b><a href={`/viewer/${this.broadcastId}`} target="_blank" rel="noopener noreferrer">Viewer link</a></b>
        <div><button onClick={() => this.toggleBroadcast()}>{broadcastStateText}</button></div>
        <div id="video-player">
          <div className="loading" ref={this.loadingRef}>
            <p><i className="fa fa-circle-o-notch spin" /></p> 
            <p>Loading Video... </p>
            <p>Connected {this.state.numPeers} peers</p>
            <p>Buffered {this.state.progress}%</p>
          </div>
          <video ref={this.videoRef} controls />
        </div>
        <a href="#remove-planer" className="close" onClick={this.removeVideoPlayer}><i className="fa fa-close" /></a>
      </div>)
  }
}
