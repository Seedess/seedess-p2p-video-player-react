const EventEmitter = require('events')

const debug = require('debug')('torrent-video-player:lib/BroadcastChannels')

const ERR_CHANNEL_EXISTS = 101

/**
 * Manages the broadcast channels
 */
class BroadcastChannels extends EventEmitter {
  
  /**
  * io = socket.io
  * opts = {
  *   maxChannels: 2000
  * }
  */
  constructor(io, opts = {}) {
    super()
    this.items = []
    this.opts = Object.assign({
      maxChannels: 2000
    }, opts)
    this.io = global.io || require('socket.io')
  }
  
  create(namespace, secret, callback) {
    var self = this
    debug('Creating channel', namespace)
    
    if (this.items.length >= this.opts.maxChannels) {
      return callback(new Error('Max channels reached'))
    }
    
    this.items[namespace] = {
      namespace: namespace,
      secret: secret
    }
    
    debug('created ', namespace)
    callback(null, this.items[namespace])
  }
  
  exists(namespace) {
    return (namespace in this.items)
  }
  
  validateSecret(namespace, secret) {
    if (!this.exists(namespace)) return false
    return secret == this.items[namespace].secret
  }
  
  remove(namespace) {
    delete this.items[namespace]
    this.emit('remove', namespace)
  }
  
}

module.exports = BroadcastChannels