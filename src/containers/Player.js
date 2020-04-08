import React from 'react'
import EventedComponent from '../lib/evented-component'
import VideoPlayer from '../components/VideoPlayer'
import Chart from '../components/Chart'
import PieChart from '../components/PieChart'
import '../styles/player.css'

import queryString from 'query-string'
const params = queryString.parse(global.location.search) // todo remove

const debug = require('debug')('torrent-video-player:containers/Player')

export default class Player extends EventedComponent {

  constructor() {
    super()
    this.videoRef = this.videoRef.bind(this)
  }

  videoRef(ref) {
    if (ref) {
      debug('VideoPlayer ref', ref)
      setImmediate(() => ref.playVideo())
      ref.on('play', video => {
        debug('playing video', video)
        this.emit('play', video)
      })
      ref.on('state', state => {
        //debug('video state', state)
        this.emit('state', state)

      })
      ref.on('torrent', torrent => {
        this.emit('torrent', torrent)
        debug('torrent added', torrent)
        torrent.on('peer', peer => {
          debug('new peer', peer)
        })
      })
    }
  }

  render() {

    const { match, location } = this.props
  
    const torrent = match.params[0]
    
    let infoHash = params.infoHash
    let magnetUri = params.magnetUri
    let torrentUrl = params.torrentUrl
    if (torrent) {
      if (torrent.match(/^[0-9a-z]{40}$/i)) {
        infoHash = torrent
      }
      if (torrent.match(/^magnet:/i)) {
        magnetUri = torrent + location.search
      }
      if (torrent.match(/^https?:/i)) {
        torrentUrl = torrent
      }
    }
    
    const video = { 
      title: params.title, 
      url: params.url, 
      infoHash: infoHash,
      magnetUri: magnetUri, 
      torrentUrl: torrentUrl
    }
    
    debug('splat', video)
    
    return (<div className="video-container">
      <VideoPlayer
        {...this.props} 
        video={video} ref={this.videoRef}
      />
      <Chart video={this} />
      <PieChart video={this} />
    </div>)
  }
}