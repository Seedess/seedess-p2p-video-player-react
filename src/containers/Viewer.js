import React from 'react'
import Viewer from '../components/Viewer'
import io from '../lib/io'
import queryString from 'query-string'
import config from '../config'

const params = queryString.parse(global.location.search) // todo: remove
const debug = require('debug')('torrent-video-player:containers/Viewer')

const videoRef = (ref) =>  {
  if (ref) {
    debug('Viewer ref', ref)
    setImmediate(ref.playVideo())
    ref.on('play', video => debug('playing video', video))
  }
}

const video = { title: params.title, peerId: params.peerId }

export default props => {
  
  global.WEBTORRENT_ANNOUNCE = config.trackers
  
  const broadcastId = props.match.params.namespace || params.id

  const channel = io(broadcastId)

  return (<Viewer
    {...props} 
    Emitter={channel} video={video} ref={videoRef} broadcastId={broadcastId}
  />)
} 