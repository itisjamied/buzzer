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
    } else if (req.url === '/style.css') {
        // Serve style.css
        fs.readFile(path.join(__dirname, 'style.css'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading style.css');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/css' });
                res.end(data);
            }
        });
    } else if (req.url === '/script.js') {
        // Serve script.js
        fs.readFile(path.join(__dirname, 'script.js'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading script.js');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/javascript' });
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

// Helper function to send player updates to host
const updateHostPlayers = (gameCode) => {
    if (games[gameCode] && games[gameCode].host) {
        games[gameCode].host.send(JSON.stringify({
            type: 'playerUpdate',
            players: games[gameCode].players
        }));
    }
};

// Helper function to send buzz updates to host
const updateHostBuzzStatus = (gameCode) => {
    if (games[gameCode] && games[gameCode].host) {
        games[gameCode].host.send(JSON.stringify({
            type: 'buzzUpdate',
            buzzedPlayers: games[gameCode].buzzes,
            totalPlayers: games[gameCode].players.length
        }));
    }
};

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        if (data.type === 'host') {
            if (!games[data.gameCode]) {
                games[data.gameCode] = { host: ws, players: [], buzzes: [] };
            } else {
                games[data.gameCode].host = ws;
            }
        } else if (data.type === 'join') {
            if (!games[data.gameCode]) {
                games[data.gameCode] = { host: null, players: [], buzzes: [] };
            }
            games[data.gameCode].players.push(data.playerName);
            // Send updated player list to host
            updateHostPlayers(data.gameCode);
        } else if (data.type === 'start') {
            // Reset buzzes array for new round
            games[data.gameCode].buzzes = [];
            // Notify all players the round has started
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'start' }));
                }
            });
            // Send initial buzz status to host
            updateHostBuzzStatus(data.gameCode);
        } else if (data.type === 'buzz') {
            if (!games[data.gameCode].buzzes.includes(data.playerName)) {
                games[data.gameCode].buzzes.push(data.playerName);
                // Send updated buzz status to host
                updateHostBuzzStatus(data.gameCode);
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
        // Clean up games and remove disconnected players
        for (const gameCode in games) {
            if (games[gameCode].host === ws) {
                games[gameCode].host = null;
            } else {
                // Find and remove disconnected player
                for (const gameCode in games) {
                    const players = games[gameCode].players;
                    for (let i = players.length - 1; i >= 0; i--) {
                        if (ws === players[i]) {
                            players.splice(i, 1);
                            updateHostPlayers(gameCode);
                            break;
                        }
                    }
                }
            }
        }
        console.log('Client disconnected');
    });
});

// server.listen(8080, () => {
//     console.log('Server is running on http://localhost:8080');
// });

const port = process.env.PORT || 8080;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});