import EventEmitter from 'events'

const debug = require('debug')('torrent-video-player:lib/PlayQueue')

// play states
const STATE_INACTIVE = 0
const STATE_ACTIVE = 1
const STATE_COMPLETE = 2

/**
 * Manages the chunks played by video player
 * TODO: Stream interface instead of Queue
 */
export default class PlayQueue extends EventEmitter {
  
  /**
  * opts = {
  *   maxItemsInQueue: 200
  * }
  */
  constructor(opts = {}) {
    super()
    this.items = []
    this.opts = Object.assign({
      maxItemsInQueue: 200
    }, opts)
  }
  
  push(torrent) {
    debug('pushing torrent', torrent)
    if (this.items.length > this.opts.maxItemsInQueue) {
      return this.emit('full', torrent)
    }
    this.items.push(torrent)
    this.emit('push')
  }
  
  next(cb) {
    var item = this.items[0]
    if (item) {
      debug('next', item)
      typeof cb == 'function' && cb(item)
      this.emit('next', item)
      this.remove(item)
    } else {
      this.once('push', () => this.next(cb))
    }
  }
  
  remove(torrent) {
    this.items = this.items.filter(item => item.infoHash != torrent.infoHash)
    this.emit('remove', torrent)
  }
  
}