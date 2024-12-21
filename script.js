const ws = new WebSocket(getWebSocketUrl());
let gameCode = '';
let isHost = false;
let playerName = '';

// Page Elements
const pages = {
    home: document.getElementById('homePage'),
    host: document.getElementById('hostPage'),
    join: document.getElementById('joinPage'),
    waiting: document.getElementById('waitingPage'),
    buzz: document.getElementById('buzzPage'),
    result: document.getElementById('resultPage')
};

// Create countdown element
const countdownDisplay = document.createElement('div');
countdownDisplay.id = 'countdownDisplay';
countdownDisplay.style.cssText = `
    font-size: 6rem;
    font-weight: bold;
    color: white;
    text-align: center;
    margin: 2rem 0;
    animation: bounceIn 0.3s ease;
`;
document.getElementById('buzzPage').insertBefore(countdownDisplay, document.getElementById('buzzStatus'));

// Switch between pages
const switchPage = (page) => {
    Object.values(pages).forEach(p => p.classList.remove('active'));
    pages[page].classList.add('active');
};

// Add back button functionality
const addBackButton = (pageId) => {
    const page = document.getElementById(pageId);
    const backButton = document.createElement('button');
    backButton.textContent = '← Back';
    backButton.className = 'back-button';
    backButton.addEventListener('click', () => {
        switchPage('home');
    });
    page.appendChild(backButton);
};

addBackButton('hostPage');
addBackButton('joinPage');

document.getElementById('hostButton').addEventListener('click', () => {
    isHost = true;
    gameCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    document.getElementById('gameCode').textContent = gameCode;
    ws.send(JSON.stringify({ type: 'host', gameCode }));
    switchPage('host');
});

document.getElementById('joinButton').addEventListener('click', () => {
    switchPage('join');
});

document.getElementById('gameCodeInput').addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
});

document.getElementById('joinGameButton').addEventListener('click', () => {
    gameCode = document.getElementById('gameCodeInput').value.trim();
    playerName = document.getElementById('playerNameInput').value.trim();
    if (gameCode && playerName) {
        ws.send(JSON.stringify({ type: 'join', gameCode, playerName }));
        switchPage('waiting');
    }
});

document.getElementById('startRoundButton').addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'start', gameCode }));
    switchPage('buzz');
    // Hide both buzz button and status initially during countdown
    document.getElementById('buzzStatus').style.display = 'none';
    document.getElementById('buzzButton').style.display = 'none';
});

document.getElementById('buzzButton').addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'buzz', gameCode, playerName }));
    document.getElementById('buzzButton').disabled = true;
});

const updatePlayerList = (players) => {
    const playerCount = document.getElementById('playerCount');
    const connectedPlayers = document.getElementById('connectedPlayers');
    
    playerCount.textContent = players.length;
    connectedPlayers.innerHTML = '';
    
    players.forEach(player => {
        const li = document.createElement('li');
        li.textContent = player;
        connectedPlayers.appendChild(li);
    });
};

const updateBuzzStatus = (buzzedPlayers, totalPlayers) => {
    const buzzCounter = document.getElementById('buzzCounter');
    const buzzOrder = document.getElementById('buzzOrder');
    
    buzzCounter.textContent = buzzedPlayers.length;
    buzzOrder.innerHTML = '';
    
    buzzedPlayers.forEach((player, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${player}`;
        buzzOrder.appendChild(li);
    });
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'playerUpdate' && isHost) {
        updatePlayerList(data.players);
    } else if (data.type === 'countdown') {
        // Show countdown display and hide other elements
        countdownDisplay.style.display = 'block';
        document.getElementById('buzzStatus').style.display = 'none';
        document.getElementById('buzzButton').style.display = 'none';
        
        // Update countdown number with animation
        countdownDisplay.textContent = data.count;
        countdownDisplay.style.animation = 'none';
        countdownDisplay.offsetHeight; // Trigger reflow
        countdownDisplay.style.animation = 'bounceIn 0.3s ease';
    } else if (data.type === 'start') {
        // Hide countdown and show appropriate elements
        countdownDisplay.style.display = 'none';
        document.getElementById('buzzButton').disabled = false;
        document.getElementById('buzzButton').classList.remove('disabled');
        document.getElementById('buzzOrder').innerHTML = '';
        document.getElementById('buzzCounter').textContent = '0';

        // Show appropriate elements based on host status
        document.getElementById('buzzStatus').style.display = isHost ? 'block' : 'none';
        document.getElementById('buzzButton').style.display = isHost ? 'none' : 'block';

        if (isHost) {
            updateBuzzStatus([], document.getElementById('playerCount').textContent);
        }
    } else if (data.type === 'buzzUpdate' && isHost) {
        updateBuzzStatus(data.buzzedPlayers, data.totalPlayers);
    } else if (data.type === 'results') {
        const resultsList = document.getElementById('resultsList');
        resultsList.innerHTML = '';
        data.results.forEach((result, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${result}`;
            resultsList.appendChild(li);
        });

        if (isHost) {
            let startNewRoundButton = document.getElementById('startNewRoundButton');
            if (!startNewRoundButton) {
                startNewRoundButton = document.createElement('button');
                startNewRoundButton.textContent = 'Start New Round';
                startNewRoundButton.id = 'startNewRoundButton';
                startNewRoundButton.addEventListener('click', () => {
                    ws.send(JSON.stringify({ type: 'start', gameCode }));
                    switchPage('buzz');
                });
                document.getElementById('resultPage').appendChild(startNewRoundButton);
            }
            startNewRoundButton.style.display = 'block';
        }

        switchPage('result');
    }
};