import EventEmitter from 'events'
import tracker from './tracker'
import parseTorrent from 'parse-torrent'
import config from '../config'

const global = global || window
const WebTorrent = global.WebTorrent
const debug = require('debug')('torrent-video-player:lib/DownloadQueue')

// download states TODO: track progress and drop slow/dead downloads
const STATE_DOWNLOAD_INACTIVE = 0
const STATE_DOWNLOAD_ACTIVE = 1
const STATE_DOWNLOAD_COMPLETE = 2

/**
 * Manages the torrent download queue
 */
export default class DownloadQueue extends EventEmitter {
  
  /**
  * opts = {
  *   broadcaster: new WebTorrent()
  *   maxActiveDownloads: 5,
  *   maxDownloadQueue: 20
  * }
  */
  constructor(opts = {}) {
    super()
    this.items = []
    this.broadcaster = opts.broadcaster || new WebTorrent({ dht: false })
    this.opts = Object.assign({
      maxActiveDownloads: 5,
      maxDownloadQueue: 20
    }, opts)
  }
  
  push(magnetURI) {
    debug('pushing magnetURI', magnetURI)
    this.items.push({magnetURI: magnetURI, state: STATE_DOWNLOAD_INACTIVE})
    
    if (this.items.length > this.opts.maxDownloadQueue) {
      this.destroyDownloading()
      this.sliceInHalf()
    }
    
    if (this.opts.maxActiveDownloads > this.activeDownloads().length) {
      this.downloadNextItemInQueue()
    }
  }
  
  downloadItem(item) {
    debug('downloading item', item)
    
    const opts = {
      //announceList: [['https://tracker.seedess.com/announce']],
      announce: config.trackers,
      dht: false
    }
    
    this.setStateDownloadActive(item.magnetURI)
    this.broadcaster.add(item.magnetURI, opts, (torrent) => {
      this.remove(torrent.magnetURI)
      debug('Torrent downloaded', torrent.magnetURI)
      this.emit('downloaded', torrent)
    })
    
    return // TODO remove
    
    var client = tracker(parseTorrent(item.magnetURI).infoHash)
    client.on('peer', function (addr) {
      debug('found a peer: ' + addr) // 85.10.239.191:48623 
    })
    
  }
  
  downloadNextItemInQueue() {
    debug('downloading next item', this.items)
    var item = this.items.find(item => item.state == STATE_DOWNLOAD_INACTIVE)
    item && this.downloadItem(item)
  }
  
  activeDownloads() {
    return this.items.filter(item => item.state == STATE_DOWNLOAD_ACTIVE)
  }
  
  setState(magnetURI, state) {
    this.items.find(item => item.magnetURI == magnetURI).state = state
  }
  
  setStateDownloadActive(magnetURI) {
    this.setState(magnetURI, STATE_DOWNLOAD_ACTIVE)
  }
  
  remove(magnetURI) {
    this.items = this.items.filter(item => item.magnetURI !== magnetURI)
    this.downloadNextItemInQueue()
  }
  
  destroyDownloading() {
    this.items.filter( (item, i) => {
      if (item.state == STATE_DOWNLOAD_ACTIVE) {
        var torrent = this.broadcaster.get(item.magnetURI)
        torrent && torrent.destroy() || debug('Missing torrent', item)
      }
    })
  }
  
  sliceInHalf() {
    var len = this.items.length
    this.items = this.items.slice(-Math.ceil(len/2))
  }
  
}