import React from 'react'
import Broadcaster from '../components/Broadcaster'
import crypto from 'crypto'
import io from '../lib/io'
import queryString from 'query-string'

const params = queryString.parse(global.location.search) // todo remove

export default props => {
  
  // , 'wss://tracker.fastcast.nz'
  global.WEBTORRENT_ANNOUNCE = ['wss://tracker.torcdn.com']
  
  const broadcastId = props.match.params.namespace || params.id || crypto.randomBytes(20).toString('hex')
  const secret = params.secret || crypto.randomBytes(20).toString('hex')

  const debug = require('debug')('torrent-video-player:containers/Broadcaster')

  const channel = io(broadcastId)

  const videoRef = (Broadcaster) =>  {
    if (Broadcaster) {
      debug('Broadcaster', Broadcaster)
      setImmediate(Broadcaster.playVideo())

      Broadcaster.on('play', video => debug('playing video', video))

      Broadcaster.on('magnetURI', magnetURI => {
        if (!channel) {
          return debug('Channel not ready to broadcast', magnetURI)
        }
        debug('Emitting magnetURI', magnetURI)
        channel.emit('magnetURI', magnetURI)
      })

    }
  }

  const video = { title: params.title, peerId: params.peerId }
  
  
  return (<Broadcaster
    {...props} 
    video={video} ref={videoRef} broadcastId={broadcastId} secret={secret}
  />)
}