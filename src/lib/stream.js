var WebTorrent = global.WebTorrent
var Peer = require('simple-peer')
const debug = require('debug')('torrent-video-player:lib/stream')
var client = null

global.WEBTORRENT_ANNOUNCE = ['wss://tracker.openwebtorrent.com', 'wss://tracker.btorrent.xyz', 'wss://tracker.fastcast.nz']

var stream = function(magnetUri, callback) {
	return stream.client.add(magnetUri, function(torrent) {
		Object.defineProperty(torrent, 'peers', {
			get: function() {
				return stream.getPeers(torrent)
			}
		})
		torrent.getPeer = function(id) {
			return stream.getPeer(torrent, id)
		}
		callback && callback.call(this, torrent)
	})
}

stream.WEBRTC_SUPPORT = Peer.WEBRTC_SUPPORT

Object.defineProperty(stream, 'client', {
	get: function() {
		if (!client) {
			client = new WebTorrent()
		}
		return client
	}
})

stream.getTorrent = function(infoHash) {
	var torrents = this.client.torrents
	if (torrents) {
		torrents.forEach(function(i) {
			debug('Torrent: ', torrents[i])
			if (torrents[i].infoHash === infoHash) {
				return torrents[i]
			}
		})
	}
}

stream.getPeers = function(torrent) {
	var peers = []
	Object.keys(torrent.swarm._peers).forEach(function(id) {
		var peer = torrent.swarm._peers[id]
		if (id.match(/^[a-z0-9]{40}$/i)) { // non-webseed
			peers.push(peer)
		}
	})
	return peers
}

stream.getPeer = function(torrent, id) {
	return torrent.swarm._peers[id]
}

module.exports = stream
