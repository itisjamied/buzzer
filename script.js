// const ws = new WebSocket('ws://localhost:8080');
const ws = new WebSocket(getWebSocketUrl());
let gameCode = '';
let isHost = false;
let playerName = '';


// Add this to your script.js file

// Page transition animation
function switchPage(page) {
    Object.values(pages).forEach(p => {
        p.classList.remove('active');
        p.style.transform = 'translateY(20px)';
        p.style.opacity = '0';
    });
    
    // Small delay for smooth transition
    setTimeout(() => {
        pages[page].classList.add('active');
    }, 50);
}

// Buzz button animation
const buzzButton = document.getElementById('buzzButton');
if (buzzButton) {
    buzzButton.addEventListener('mousedown', () => {
        buzzButton.style.transform = 'scale(0.95)';
    });
    
    buzzButton.addEventListener('mouseup', () => {
        buzzButton.style.transform = 'scale(1)';
    });
}

// Add confetti animation for winners
function showConfetti() {
    const colors = ['#FF3355', '#4A90E2', '#FFD700', '#2ECC71'];
    
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 3000);
    }
}
// Page Elements
const pages = {
    home: document.getElementById('homePage'),
    host: document.getElementById('hostPage'),
    join: document.getElementById('joinPage'),
    waiting: document.getElementById('waitingPage'),
    buzz: document.getElementById('buzzPage'),
    result: document.getElementById('resultPage')
};

const switchPage = (page) => {
    Object.values(pages).forEach(p => p.classList.remove('active'));
    pages[page].classList.add('active');
};

// Home Page
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

// Join Page
document.getElementById('joinGameButton').addEventListener('click', () => {
    gameCode = document.getElementById('gameCodeInput').value;
    playerName = document.getElementById('playerNameInput').value;
    if (gameCode && playerName) {
        ws.send(JSON.stringify({ type: 'join', gameCode, playerName }));
        switchPage('waiting');
    }
});

// Host Page
document.getElementById('startRoundButton').addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'start', gameCode }));
    switchPage('buzz');
    // Show appropriate elements based on host status
    document.getElementById('buzzStatus').style.display = isHost ? 'block' : 'none';
    document.getElementById('buzzButton').style.display = isHost ? 'none' : 'block';
    // Update total players count
    if (isHost) {
        const playerCount = document.getElementById('playerCount').textContent;
        document.getElementById('totalPlayers').textContent = playerCount;
    }
});

// Buzz Page
document.getElementById('buzzButton').addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'buzz', gameCode, playerName }));
    document.getElementById('buzzButton').disabled = true;
});

// Update player list
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

// Update buzz status
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

// WebSocket Events
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'playerUpdate' && isHost) {
        updatePlayerList(data.players);
    } else if (data.type === 'start') {
        switchPage('buzz');
        // Show appropriate elements based on host status
        document.getElementById('buzzStatus').style.display = isHost ? 'block' : 'none';
        document.getElementById('buzzButton').style.display = isHost ? 'none' : 'block';
        // Reset buzz status for host
        if (isHost) {
            updateBuzzStatus([], document.getElementById('playerCount').textContent);
        }
    } else if (data.type === 'buzzUpdate' && isHost) {
        updateBuzzStatus(data.buzzedPlayers, data.totalPlayers);
    } else if (data.type === 'results') {
        showConfetti();
        const resultsList = document.getElementById('resultsList');
        resultsList.innerHTML = '';
        data.results.forEach((result, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${result}`;
            resultsList.appendChild(li);
        });
        switchPage('result');
    }
};

