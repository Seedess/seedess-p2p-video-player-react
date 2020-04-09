var stream = require('./stream')
var parseTorrent = require('parse-torrent')
var settings = require('../settings').default

var webseedHostUrl = settings.webseedHostUrl
var torrentHostUrl = settings.torrentHostUrl

global.stream = stream // debugging
stream.parseTorrent = parseTorrent

var debug = require('debug')('seedess:torrent')

var currentTorrent,
  torrents = [],
  webseedUpdateIntervalSecs = 5

export default function playVideo(magnetUri, infoHash, videoEl, torrentUrl, done) {
  
  debug('playVideo: ', infoHash, magnetUri, videoEl, torrentUrl)

  // best choice
  if (torrentUrl) {
    debug('we have a torrentUrl', torrentUrl)
    return streamVideo(torrentUrl, videoEl, done)
  }

  // otherwise stream from magnet and attach the dynamic .torrent url
  var torrent = parseTorrent(magnetUri || infoHash)

  // todo: webseed needs at least one peer or .torrent file https://github.com/webtorrent/webtorrent/issues/875
  torrent.xs = torrent.xs || torrentUrl || torrentHostUrl + 'torrent/' + torrent.infoHash + '.torrent' // ensure xs (.torrent file)
  var magnetUriWithXS = parseTorrent.toMagnetURI( torrent )
  
  // try just torrent id
  debug('Streaming torrent from ', magnetUriWithXS)
  return streamVideo(magnetUriWithXS, videoEl, done)
}

function streamVideo(torrentId, videoEl, done) {
  return stream(torrentId, torrent => {
    debug('Got meta data ready for ', torrent)
    onTorrentStream(torrent, videoEl)
    if (typeof done == 'function') done(torrent)
  })
}

function onTorrentStream(torrent, videoEl) {
  var webSeedUrl = getWebseedUrl(torrent)
  torrent.addWebSeed(webSeedUrl) // ensure dynamic webseed
  
  debug('Torrent ready: ', torrent)
  if (currentTorrent && torrent.infoHash !== currentTorrent.infoHash) {
    debug('Torrent is not the current playing video..')
  }

  currentTorrent = torrent
  torrents[torrent.infoHash] = torrent

  playMainVideo(torrent, videoEl)
  //torrentStats(torrent)

  // ensure a webseed
  setInterval(function() {
    addWebSeedIfNoPeers(torrent, webSeedUrl)
  }, webseedUpdateIntervalSecs * 1000)
}

function addWebSeedIfNoPeers(torrent, url) {
  if (torrent.wires.length === 0) {
    torrent.addWebSeed(url)
  }
}

function getWebseedUrl(torrent) {
  var url = webseedHostUrl + 'file/' + torrent.infoHash + '/'
  if (torrent.files && torrent.files.length === 1) {
    url += torrent.files[0].path
  }
  return url
}

function getVideoFile(torrent) {
  var file = torrent.files[0]
  torrent.files.forEach(function (f) {
    // assumes video file is largest file
    if (f.length > file.length) {
      file = f
    }
  })
  return file
}

function playMainVideo(torrent, videoEl, done) {
  var file = getVideoFile(torrent)

  if (!videoEl) throw new TypeError('videoEl is not defined')
  
  debug('rendering to videoEl', { file, videoEl })
  file.renderTo(videoEl)
  setImmediate(() => {
    typeof(done) == 'function' && done(videoEl)
  })
}
