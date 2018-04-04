const path = require('path');
const express = require('express');

const app = express();
const server = require('http').createServer(app);

const host = process.env.HOST;
const port = process.env.PORT ? process.env.PORT : 8003;

app.use(express.static('./build'))

// Socket.io server
require('./ioServer.js')(server, app)

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

server.listen(port, host, (err) => {
  if (err) {
    console.error(err);
    return;
  }
  const address = server.address()
  console.info('==> Listening on port %s. Open up %s:%s/ in your browser.', port, host || address.address, port);
});
