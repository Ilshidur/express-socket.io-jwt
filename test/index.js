const express = require('express');
const redisAdapter = require('socket.io-redis');
const uuidv4 = require('uuid/v4');

// const sticky = require('sticky-session');
const cluster = require('sticky-cluster');

const socketAuth = require('../src');

cluster((cb) => {
  const app = express();
  const server = require('http').createServer(app);
  const io = require('socket.io')(server);

  const uuid = uuidv4();

  io.on('connect', (socket) => {
    console.log('Hello socket', uuid);

    socket.on('disconnect', (reason) => {
      console.log('Bye socket', reason);
    });
  });

  const socketMiddleware = socketAuth.createMiddleware(io, {
    secret: 'JWT_SECRET',
    connectionNameFromRequest: ({ queryParams }) => queryParams.name,
  });

  app.get('/test', socketMiddleware({ required: true, verify: () => true }), async (req, res) => {
    console.log(`HIT ${uuid}`);
    const socket1 = req.getSocket('electron-app');
    if (!socket1) {
      console.log('no socket');
      return res.status(500).send('No socket');
    }

    const payload = socket1.payload;
    console.log(payload);
    const connectionName = socket1.connectionName;
    console.log(connectionName);
    socket1.emit('message', `Hello from ${payload.yo} (${connectionName}) ${uuid}`);

    return res.status(200).send(`Hello from ${payload.yo} (${connectionName}) ${uuid}`);
  });

  cb(server);
}, {
  concurrency: 2,
  port: 3001,
  debug: true,
  env: function (index) { return { stickycluster_worker_index: index }; }
});

// io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));

// sticky.listen(server, 3001);
// server.listen(3001);
