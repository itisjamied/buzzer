const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('buzz', (timestamp) => {
    io.emit('buzzResult', { playerId: socket.id, timestamp });
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});