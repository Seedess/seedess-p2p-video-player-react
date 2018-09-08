var Client = require('bittorrent-tracker')
var crypto = require('crypto')
var parseTorrent = require('parse-torrent')
var debug = require('debug')('seedess:tracker:client')
var Peer = require('simple-peer')
var config = require('../config').default

export default function tracker(infoHash, peerId) {
  
  peerId = peerId || crypto.randomBytes(20).toString('hex')
  //var peerId = 'd6dc5155d47f14a0a947ae33e7da5cab5dc1d3e7'
  
  var opts = {
    peerId: peerId,
    infoHash: infoHash,
    port: 6881,
    announce: config.trackers, // list of tracker server urls
  }
  
  debug('new tracker client', opts)
  
  var client = new Client(opts)
 
  client.on('error', function (err) {
    // fatal client error! 
    debug(err.message)
  })

  client.on('warning', function (err) {
    // a tracker was unavailable or sent bad data to the client. you can probably ignore it 
    debug(err.message)
  })

  // start getting peers from the tracker 
  client.start()

  client.on('update', function (data) {
    debug('got an announce response from tracker: ' + data.announce)
    debug('number of seeders in the swarm: ' + data.complete)
    debug('number of leechers in the swarm: ' + data.incomplete)
    debug('All data: ', data)
  })

  client.on('peer', function (addr) {
    debug('found a peer: ', addr) // 85.10.239.191:48623 
  })

  // announce that download has completed (and you are now a seeder) 
  //client.complete()

  // force a tracker announce. will trigger more 'update' events and maybe more 'peer' events 
  client.update()

  // provide parameters to the tracker 
  /*
  client.update({
    uploaded: 0,
    downloaded: 0,
    left: 0,
    customParam: 'blah' // custom parameters supported 
  })
  
  */
  

  // stop getting peers from the tracker, gracefully leave the swarm 
  //client.stop()

  // ungracefully leave the swarm (without sending final 'stop' message) 
  //client.destroy()

  // scrape 
  //client.scrape()

  client.on('scrape', function (data) {
    debug('got a scrape response from tracker: ' + data.announce)
    debug('number of seeders in the swarm: ' + data.complete)
    debug('number of leechers in the swarm: ' + data.incomplete)
    debug('number of total downloads of this torrent: ' + data.downloaded)
  })
  
  return client
  
  setTimeout(function() {
    genPeers(10, function(peers) {
      debug('genPeers', peers)
    })
  }, 1000)
  
  genPeers(10, function(peers) {
      debug('genPeers', peers)
    })
  
  return client
  
}


function genPeers(num, cb) {
  var peers = []
  
  for(var i = 0; i < num; ++i) {
    debug('_createPeer')
     _createPeer()
  }
  _checkPeers()
  
  function _createPeer() {
    var peer = new Peer({
      initiator: true,
      trickle: false,
      wrtc: undefined,
      config: undefined
    })
  
    peer.once('signal', function (data) {
      debug('player: peer signal', data)
      peers.push(peer)
      _checkPeers()
    })
  }
  
  function _checkPeers() {
    if (num == peers.length) return cb(peers)
  }
  
  
}
 
