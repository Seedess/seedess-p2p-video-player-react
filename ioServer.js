// handlers for socket.io server
const BroadcastChannels = require('./src/lib/BroadcastChannels')

const debug = require('debug')('torrent-player:lib/ioServer')

const ERR_NUM_EXISTS = 101
const ERR_MSG_EXISTS = 'Resource exists'

module.exports = function ioServer(server, app) {
  var io = require('socket.io')(server)

  // Broadcasting hashes
  var numUsers = 0;
  var Channels = new BroadcastChannels(io, {
    maxChannels: 100 // for testing
  })
  
  function onChannelCreated(err, item) {
    var namespace = item && item.namespace
    var channel = io.of('/' + namespace || '')
    channel.on('connection', function(socket) { 
      console.log('channel connection ', namespace)

      // client recorded a chunk and emitted the magnet
      socket.on('magnetURI', function (data) {
        if (!Channels.validateSecret(data.namespace, data.secret)) {
          debug('Invalid secret', data)
          //return socket.emit('channel.error', 'Invalid secret') // TODO
        }
        channel.emit('magnetURI', data)
      })

    })
    
  }

  // socket.io
  io.on('connection', function (socket) {
    var addedUser = false;
    numUsers++
    
    console.log('Connection', socket.id, socket.nsp.name, Object.keys(socket.nsp.sockets))
    
    socket.on('channel.create', function(data) {
      var namespace = data.namespace
      var secret = data.secret
      
      console.log('channel.create', data)
      
      if (Channels.exists(namespace)) {
        console.log('Channel exists', namespace)
        return  socket.emit('channel.exists', namespace)
      }
      
      Channels.create(namespace, secret, (err, item) => {
        setImmediate(() => socket.emit('channel.created', namespace))
        onChannelCreated(err, item) 
      })
      
    })

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
      --numUsers;
    });
  });
  
  // express api
  app.get('/', (req, res) => res.send('Hello World!'))
  
  app.get('/broadcast/:namespace', (req, res, next) => {
    
    Channels.create(req.params.namespace, req.query.secret, onChannelCreated)
    
    next()
  });
  
}
