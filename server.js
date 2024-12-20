const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

const clients = new Set();

wss.on('connection', (ws) => {
    console.log('A new client connected.');
    clients.add(ws);

    ws.on('message', (message) => {
        console.log(`Received: ${message}`);
        // Broadcast the buzzer event to all clients
        clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('A client disconnected.');
        clients.delete(ws);
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
