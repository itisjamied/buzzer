const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let firstBuzzer = null; // Track who buzzed in first

wss.on('connection', (ws) => {
  console.log('A player connected');

  // Listen for messages from clients
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'buzz' && !firstBuzzer) {
      // If no one has buzzed yet, set the first buzzer
      firstBuzzer = data.player;
      broadcast(JSON.stringify({ type: 'firstBuzz', player: firstBuzzer }));
    }

    if (data.type === 'reset') {
      // Reset the buzzer
      firstBuzzer = null;
      broadcast(JSON.stringify({ type: 'reset' }));
    }
  });

  // Notify all clients who connected
  ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to the buzzer server' }));
});

// Broadcast a message to all connected clients
function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

console.log('WebSocket server is running on ws://localhost:8080');
