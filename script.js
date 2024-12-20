// const ws = new WebSocket('ws://localhost:8080');
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
// document.getElementById('joinGameButton').addEventListener('click', () => {
//     gameCode = document.getElementById('gameCodeInput').value;
//     playerName = document.getElementById('playerNameInput').value;
//     if (gameCode && playerName) {
//         ws.send(JSON.stringify({ type: 'join', gameCode, playerName }));
//         switchPage('waiting');
//     }
// });

//Automatically transform game code input to uppercase
document.getElementById('gameCodeInput').addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
});

// Fix paste issue in Join Game functionality
document.getElementById('joinGameButton').addEventListener('click', () => {
    gameCode = document.getElementById('gameCodeInput').value.trim();
    playerName = document.getElementById('playerNameInput').value.trim();
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

  if (data.type === "playerUpdate" && isHost) {
    updatePlayerList(data.players);
  } else if (data.type === "start") {
    switchPage("buzz");
    // Show appropriate elements based on host status
    document.getElementById("buzzStatus").style.display = isHost
      ? "block"
      : "none";
    document.getElementById("buzzButton").style.display = isHost
      ? "none"
      : "block";
    // Reset buzz status for host
    if (isHost) {
      updateBuzzStatus([], document.getElementById("playerCount").textContent);
    }
  } else if (data.type === "buzzUpdate" && isHost) {
    updateBuzzStatus(data.buzzedPlayers, data.totalPlayers);
  } else if (data.type === "results") {
    const resultsList = document.getElementById("resultsList");
    resultsList.innerHTML = "";
    data.results.forEach((result, index) => {
      const li = document.createElement("li");
      li.textContent = `${index + 1}. ${result}`;
      resultsList.appendChild(li);
    });

    // Check if the user is the host and add the "Start New Round" button
    if (isHost) {
      let startNewRoundButton = document.getElementById("startNewRoundButton");
      if (!startNewRoundButton) {
        startNewRoundButton = document.createElement("button");
        startNewRoundButton.textContent = "Start New Round";
        startNewRoundButton.id = "startNewRoundButton";
        startNewRoundButton.addEventListener("click", () => {
          ws.send(JSON.stringify({ type: "start", gameCode }));
          switchPage("buzz");
        });
        document.getElementById("resultPage").appendChild(startNewRoundButton);
      }
      startNewRoundButton.style.display = "block"; // Ensure it is visible
    }

    switchPage("result");
  }
};


