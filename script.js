const player1Button = document.getElementById('player1');
const player2Button = document.getElementById('player2');
const winnerDisplay = document.getElementById('winner');

let fastestTime = Infinity;
let fastestPlayer = null;

player1Button.addEventListener('click', () => {
    const currentTime = performance.now();
    if (currentTime < fastestTime) {
        fastestTime = currentTime;
        fastestPlayer = 'Player 1';
    }
    updateWinnerDisplay();
});

player2Button.addEventListener('click', () => {
    const currentTime = performance.now();
    if (currentTime < fastestTime) {
        fastestTime = currentTime;
        fastestPlayer = 'Player 2';
    }
    updateWinnerDisplay();
});

function updateWinnerDisplay() {
    winnerDisplay.textContent = fastestPlayer ? `${fastestPlayer} wins!` : '';
}