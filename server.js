const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    if (req.url === '/') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

const wss = new WebSocket.Server({ server });

const games = {};

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        if (data.type === 'join') {
            if (!games[data.gameCode]) {
                games[data.gameCode] = { host: null, players: [], buzzes: [] };
            }
            games[data.gameCode].players.push(data.playerName);
        } else if (data.type === 'start') {
            games[data.gameCode].host = ws;
            // Notify all players the round has started
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'start' }));
                }
            });
        } else if (data.type === 'buzz') {
            if (!games[data.gameCode].buzzes.includes(data.playerName)) {
                games[data.gameCode].buzzes.push(data.playerName);
            }
    
            // Check if all players have buzzed
            if (games[data.gameCode].buzzes.length === games[data.gameCode].players.length) {
                const results = games[data.gameCode].buzzes;
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'results', results }));
                    }
                });
            }
        }
    });
    
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

server.listen(8080, () => {
    console.log('Server is running on http://localhost:8080');
});
