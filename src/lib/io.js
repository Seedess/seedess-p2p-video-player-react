const io = global.io
let sockets = {}

/**
 * Returns a singleton namespaced io
 */
function ioFactory(namespace) {
  namespace = namespace || '/'
  if (namespace === '/') return sockets[namespace] = io()
  return sockets[namespace] = sockets[namespace] || io('/' + namespace)
}

module.exports = ioFactory