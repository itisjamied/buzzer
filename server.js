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

// Helper function to broadcast countdown to all players in a game
// const startCountdown = (gameCode) => {
//     const game = games[gameCode];
//     if (!game) return;

//     const countdownFrom = 3;
//     let currentCount = countdownFrom;
    
//     // Send initial countdown message
//     wss.clients.forEach(client => {
//         if (client.readyState === WebSocket.OPEN) {
//             client.send(JSON.stringify({ 
//                 type: 'countdown',
//                 count: currentCount
//             }));
//         }
//     });

//     // Set up countdown interval
//     const countdownInterval = setInterval(() => {
//         currentCount--;
        
//         if (currentCount > 0) {
//             // Send current count
//             wss.clients.forEach(client => {
//                 if (client.readyState === WebSocket.OPEN) {
//                     client.send(JSON.stringify({ 
//                         type: 'countdown',
//                         count: currentCount
//                     }));
//                 }
//             });
//         } else {
//             // Countdown finished, start the round
//             clearInterval(countdownInterval);
//             games[gameCode].buzzes = [];
//             wss.clients.forEach(client => {
//                 if (client.readyState === WebSocket.OPEN) {
//                     client.send(JSON.stringify({ type: 'start' }));
//                 }
//             });
//             updateHostBuzzStatus(gameCode);
//         }
//     }, 1000);
// };

// In server.js
// const startCountdown = (gameCode) => {
//     const game = games[gameCode];
//     if (!game) return;

//     const countdownFrom = 3;
//     let currentCount = countdownFrom;
    
//     const sendToGameParticipants = (message) => {
//         // Send to host
//         if (game.host && game.host.readyState === WebSocket.OPEN) {
//             game.host.send(JSON.stringify(message));
//         }
//         // Send to all players
//         game.playerConnections.forEach((ws) => {
//             if (ws.readyState === WebSocket.OPEN) {
//                 ws.send(JSON.stringify(message));
//             }
//         });
//     };

//     // Send initial countdown
//     sendToGameParticipants({ 
//         type: 'countdown',
//         count: currentCount 
//     });

//     const countdownInterval = setInterval(() => {
//         currentCount--;
        
//         if (currentCount > 0) {
//             sendToGameParticipants({ 
//                 type: 'countdown',
//                 count: currentCount 
//             });
//         } else {
//             clearInterval(countdownInterval);
//             games[gameCode].buzzes = [];
//             sendToGameParticipants({ type: 'start' });
//             updateHostBuzzStatus(gameCode);
//         }
//     }, 1000);
// };

const sendToPlayersOnly = (message) => {
    game.playerConnections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    });
};

const startCountdown = (gameCode) => {
    const game = games[gameCode];
    if (!game) return;

    const countdownFrom = 3;
    let currentCount = countdownFrom;

    sendToPlayersOnly({ type: 'countdown', count: currentCount });

    const countdownInterval = setInterval(() => {
        currentCount--;

        if (currentCount > 0) {
            sendToPlayersOnly({ type: 'countdown', count: currentCount });
        } else {
            clearInterval(countdownInterval);
            game.buzzes = [];
            sendToPlayersOnly({ type: 'start' });
        }
    }, 1000);
};



wss.on('connection', (ws) => {

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        if (data.type === 'host') {
            if (!games[data.gameCode]) {
                games[data.gameCode] = { host: ws, players: [], playerConnections: new Map(), buzzes: [] };
            } else {
                games[data.gameCode].host = ws;
            }
        } else if (data.type === 'join') {
            if (!games[data.gameCode]) {
                games[data.gameCode] = { host: null, players: [],  playerConnections: new Map(), buzzes: [] };
            }
            games[data.gameCode].players.push(data.playerName);
            games[data.gameCode].playerConnections.set(data.playerName, ws);
            updateHostPlayers(data.gameCode);
        } else if (data.type === 'start') {
            // Start countdown instead of immediately starting the round
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
            startCountdown(data.gameCode);
        } else if (data.type === 'buzz') {
            if (!games[data.gameCode].buzzes.includes(data.playerName)) {
                games[data.gameCode].buzzes.push(data.playerName);
                updateHostBuzzStatus(data.gameCode);
            }
    
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

    
    // ws.on('close', () => {
    //     for (const gameCode in games) {
    //         if (games[gameCode].host === ws) {
    //             games[gameCode].host = null;
    //         } else {
    //             for (const gameCode in games) {
    //                 const players = games[gameCode].players;
    //                 for (let i = players.length - 1; i >= 0; i--) {
    //                     if (ws === players[i]) {
    //                         players.splice(i, 1);
    //                         updateHostPlayers(gameCode);
    //                         break;
    //                     }
    //                 }
    //             }
    //         }
    //     }
    //     console.log('Client disconnected');
    // });

    ws.on('close', () => {
        for (const gameCode in games) {
            const game = games[gameCode];
            
            // Check if it's the host
            if (game.host === ws) {
                game.host = null;
            }
            
            // Check if it's a player
            game.playerConnections.forEach((connection, playerName) => {
                if (connection === ws) {
                    game.playerConnections.delete(playerName);
                    const playerIndex = game.players.indexOf(playerName);
                    if (playerIndex !== -1) {
                        game.players.splice(playerIndex, 1);
                    }
                    updateHostPlayers(gameCode);
                }
            });
        }
    });

});

const port = process.env.PORT || 8080;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});