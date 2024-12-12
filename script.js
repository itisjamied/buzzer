const roleSelection = document.getElementById('role-selection');
const hostControls = document.getElementById('host-controls');
const playerControls = document.getElementById('player-controls');
const results = document.getElementById('results');
const startTimerButton = document.getElementById('start-timer');
const playerButton = document.getElementById('player-button');
const timerDisplay = document.getElementById('timer-display');
const playerTimeDisplay = document.getElementById('player-time-display');
const playerTimesList = document.getElementById('player-times');
const winnerDisplay = document.getElementById('winner-display');

let isHost = false;
let timerInterval;
let playerTimes = [];

// ... previous JavaScript logic for button clicks and time measurement ...

// Host and Player Role Selection
hostButton.addEventListener('click', () => {
    isHost = true;
    roleSelection.style.display = 'none';
    hostControls.style.display = 'block';
});

playerButton.addEventListener('click', () => {
    isHost = false;
    roleSelection.style.display = 'none';
    playerControls.style.display = 'block';
});

// Host Controls
startTimerButton.addEventListener('click', () => {
    // Start the timer and broadcast the start to players
    // (You'll need a real-time communication mechanism like WebSockets or a server-side solution to implement this)
    startTimer();
});

function startTimer() {
    let timeLeft = 10; // Adjust the timer duration as needed
    timerInterval = setInterval(() => {
        timerDisplay.textContent = timeLeft;
        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(timerInterval);
            showResults();
        }
    }, 1000);
}

// Player Controls
playerButton.addEventListener('click', () => {
    // Record player's time and send it to the host
    // (Again, you'll need a real-time communication mechanism)
    const playerTime = performance.now() - startTime;
    playerTimes.push({ player: 'Player', time: playerTime });
    playerTimeDisplay.textContent = `Your time: ${playerTime}ms`;
    playerButton.disabled = true;
});

// Show Results
function showResults() {
    hostControls.style.display = 'none';
    playerControls.style.display = 'none';
    results.style.display = 'block';

    playerTimes.forEach(player => {
        const li = document.createElement('li');
        li.textContent = `${player.player}: ${player.time}ms`;
        playerTimesList.appendChild(li);
    });

    // Determine the winner and display it
    const fastestTime = Math.min(...playerTimes.map(p => p.time));
    const winner = playerTimes.find(p => p.time === fastestTime).player;
    winnerDisplay.textContent = `Winner: ${winner}`;
}