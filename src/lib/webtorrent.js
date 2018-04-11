/**
 * Webtorrent helpers
 */

/**
 * 
 * @param {WebTorrent.Torrent} torrent 
 * @param {string} id 
 * 
 * @returns {simple-peer}
 */
export const getPeerById = (torrent, id) => {
  let peer
  if (typeof id === 'string') {
      peer = torrent._peers[id]
  } else {
      peer = torrent._peers[id.id]
  }
  if (peer.wire === null) {
      peer.wire = getPeerWire(torrent, peer)
  }
  return peer
}

/**
 * 
 * @param {WebTorrent.Torrent} torrent 
 * @param {simple-peer} peer 
 */
export const getPeerWire = (torrent, peerId) => {
  return torrent.wires.filter(wire => wire.peerId == peerId)[0]
}

/**
 * 
 * @param {simple-peer} peer 
 */
export const getPeerType = peer => {
  if (peer.conn && peer.conn.url) {
      if (peer.conn.url.match('https://cdn.torcdn.com/') 
          || peer.conn.url.match('https://cdn.seedess.com/')) {
          return 'bitTorrent'
      }
  }
  return peer.wire && peer.wire.type || 'webrtc'
}

/**
 * Get Peers from torrent
 * Note: Doesn't seem to be an official API for this
 * @param {WebTorrent.Torrent} torrent 
 */
export const getPeers = (torrent) => {
	Object.values(torrent._peers)
}