// --- GLOBAL HELPER FUNCTIONS (main.js content) ---
const playerBalanceElement = document.getElementById('playerBalance');
let playerBalance = 1000; // Başlanğıc balans

// Balansı yeniləmək üçün funksiya
function updateBalance(amount, isWin = false) {
    if (!isWin && playerBalance + amount < 0) {
        alert("Balansınızda kifayət qədər vəsait yoxdur!");
        return false;
    }
    playerBalance += amount;
    playerBalanceElement.textContent = playerBalance;
    playerBalanceElement.style.transition = 'none';
    playerBalanceElement.style.color = amount > 0 ? 'lightgreen' : (amount < 0 ? 'salmon' : '');
    playerBalanceElement.style.transform = 'scale(1.1)';

    setTimeout(() => {
        playerBalanceElement.style.transition = 'color 0.5s, transform 0.5s';
        playerBalanceElement.style.color = '';
        playerBalanceElement.style.transform = 'scale(1)';
    }, 100);
    setTimeout(() => {
        playerBalanceElement.style.transition = 'none';
    }, 600);
    return true;
}

function getPlayerBalance() {
    return playerBalance;
}

// --- LEADERBOARD LOGIC (leaderboard.js content) ---
const leaderboardTableBody = document.querySelector('#leaderboardTable tbody');
const playerNameInput = document.getElementById('playerName');
const addScoreButton = document.getElementById('addPlayerToLeaderboard');
const resetLeaderboardButton = document.getElementById('resetLeaderboard');
const LEADERBOARD_KEY = 'casinoLeaderboard_codepen'; // Use a distinct key for codepen

function getLeaderboard() {
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveLeaderboard(board) {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board));
}

function renderLeaderboard() {
    const board = getLeaderboard();
    board.sort((a, b) => b.score - a.score);
    leaderboardTableBody.innerHTML = '';
    board.slice(0, 10).forEach((entry, index) => {
        const row = leaderboardTableBody.insertRow();
        row.insertCell().textContent = index + 1;
        row.insertCell().textContent = entry.name;
        row.insertCell().textContent = entry.score;
    });
}

if (addScoreButton) { // Ensure element exists before adding listener
    addScoreButton.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim();
        const currentBalance = getPlayerBalance();

        if (!playerName) {
            alert("Zəhmət olmasa, adınızı daxil edin.");
            return;
        }
        // Allow adding score even if balance is 0 or negative, as it's a "score"
        // if (currentBalance <= 0) {
        //     alert("Xal əlavə etmək üçün müsbət balansınız olmalıdır.");
        //     return;
        // }

        const board = getLeaderboard();
        const existingPlayerIndex = board.findIndex(p => p.name.toLowerCase() === playerName.toLowerCase());

        if (existingPlayerIndex > -1) {
            if (currentBalance > board[existingPlayerIndex].score) {
                board[existingPlayerIndex].score = currentBalance;
                alert(`${playerName}, xalınız yeniləndi: ${currentBalance}`);
            } else {
                alert(`${playerName}, mövcud xalınız (${board[existingPlayerIndex].score}) daha yüksəkdir və ya bərabərdir.`);
                playerNameInput.value = '';
                return;
            }
        } else {
            board.push({ name: playerName, score: currentBalance });
            alert(`${playerName}, xalınız (${currentBalance}) liderlər cədvəlinə əlavə olundu!`);
        }

        saveLeaderboard(board);
        renderLeaderboard();
        playerNameInput.value = '';
    });
}

if (resetLeaderboardButton) {
    resetLeaderboardButton.addEventListener('click', () => {
        if (confirm("Liderlər cədvəlini sıfırlamaq istədiyinizə əminsiniz?")) {
            localStorage.removeItem(LEADERBOARD_KEY);
            renderLeaderboard();
            alert("Liderlər cədvəli sıfırlandı.");
        }
    });
}


// --- SLOT MACHINE LOGIC (slot_machine.js content) ---
const slotReel1 = document.getElementById('reel1');
const slotReel2 = document.getElementById('reel2');
const slotReel3 = document.getElementById('reel3');
const spinButton = document.getElementById('spinButton');
const slotBetInput = document.getElementById('slotBet');
const slotMessage = document.getElementById('slotMessage');

const slotSymbols = ['🍒', '🍋', '🍊', '🍉', '🔔', '⭐', '💎', '💰'];
const slotPayouts = {
    '🍒🍒🍒': 5, '🍋🍋🍋': 10, '🍊🍊🍊': 15, '🍉🍉🍉': 20,
    '🔔🔔🔔': 50, '⭐⭐⭐': 75, '💎💎💎': 100, '💰💰💰': 250,
};

function createSlotSymbolTrack(reelElement) {
    let track = reelElement.querySelector('.symbol-track');
    if (track) track.remove();

    track = document.createElement('div');
    track.className = 'symbol-track';
    let shuffledSymbols = [...slotSymbols].sort(() => 0.5 - Math.random());
    shuffledSymbols.forEach(symbol => {
        const span = document.createElement('span');
        span.textContent = symbol;
        track.appendChild(span);
    });
    shuffledSymbols.slice(0, 3).forEach(symbol => {
        const span = document.createElement('span');
        span.textContent = symbol;
        track.appendChild(span);
    });
    reelElement.appendChild(track);
    return track;
}

const slotReelElements = [slotReel1, slotReel2, slotReel3];
if (slotReel1 && slotReel2 && slotReel3) { // Check if elements exist
    slotReelElements.forEach(r => {
        if (r) createSlotSymbolTrack(r);
    });
}


function spinSingleReel(reelElement, finalSymbolIndex) {
    return new Promise(resolve => {
        if (!reelElement) { // Add a check
            resolve();
            return;
        }
        const track = createSlotSymbolTrack(reelElement);
        reelElement.classList.add('spinning');
        const spinDuration = 800 + Math.random() * 700;

        setTimeout(() => {
            reelElement.classList.remove('spinning');
            if (track) track.remove();
            reelElement.textContent = slotSymbols[finalSymbolIndex];
            resolve();
        }, spinDuration);
    });
}

if (spinButton) {
    spinButton.addEventListener('click', () => {
        const betAmount = parseInt(slotBetInput.value);
        if (isNaN(betAmount) || betAmount <= 0) {
            slotMessage.textContent = "Düzgün mərc daxil edin.";
            slotMessage.className = 'message lose';
            return;
        }

        if (!updateBalance(-betAmount)) {
            slotMessage.textContent = "Balansınızda kifayət qədər vəsait yoxdur!";
            slotMessage.className = 'message lose';
            return;
        }

        slotMessage.textContent = "Fırlanır...";
        slotMessage.className = 'message';
        spinButton.disabled = true;

        const result1 = Math.floor(Math.random() * slotSymbols.length);
        const result2 = Math.floor(Math.random() * slotSymbols.length);
        const result3 = Math.floor(Math.random() * slotSymbols.length);

        Promise.all([
            spinSingleReel(slotReel1, result1),
            spinSingleReel(slotReel2, result2),
            spinSingleReel(slotReel3, result3)
        ]).then(() => {
            const finalSymbols = [slotSymbols[result1], slotSymbols[result2], slotSymbols[result3]];
            if(slotReel1) slotReel1.textContent = finalSymbols[0];
            if(slotReel2) slotReel2.textContent = finalSymbols[1];
            if(slotReel3) slotReel3.textContent = finalSymbols[2];

            const combination = finalSymbols.join('');
            let winnings = 0;

            if (slotPayouts[combination]) {
                winnings = slotPayouts[combination] * betAmount;
                slotMessage.textContent = `QAZANDINIZ! ${finalSymbols.join(' ')} (+${winnings}$)`;
                slotMessage.className = 'message win';
                updateBalance(winnings, true);
            } else if (finalSymbols[0] === finalSymbols[1] || finalSymbols[1] === finalSymbols[2] || finalSymbols[0] === finalSymbols[2]) {
                 // Two identical symbols, also check first and third
                winnings = Math.floor(betAmount / 2);
                 if (winnings > 0) { // Only give winnings if betAmount was high enough
                    slotMessage.textContent = `Kiçik uduş! (+${winnings}$)`;
                    slotMessage.className = 'message win';
                    updateBalance(winnings, true);
                 } else {
                    slotMessage.textContent = "Uduzduz. Yenidən cəhd edin!";
                    slotMessage.className = 'message lose';
                 }
            } else {
                slotMessage.textContent = "Uduzduz. Yenidən cəhd edin!";
                slotMessage.className = 'message lose';
            }
            spinButton.disabled = false;
        });
    });
}

// --- ROULETTE LOGIC (roulette.js content) ---
const rouletteWheelNumbersDiv = document.querySelector('#rouletteWheel .wheel-numbers');
const rouletteResultDisplay = document.getElementById('rouletteResult');
const spinRouletteButton = document.getElementById('spinRouletteButton');
const rouletteBetAmountInput = document.getElementById('rouletteBetAmount');
const rouletteNumberBetInput = document.getElementById('rouletteNumberBet');
const rouletteBetOptionButtons = document.querySelectorAll('.roulette-controls .bet-option');
const rouletteMessage = document.getElementById('rouletteMessage');

const rouletteNumbers = [
    { num: 0, color: 'green' }, { num: 1, color: 'red' }, { num: 2, color: 'black' },
    { num: 3, color: 'red' }, { num: 4, color: 'black' }, { num: 5, color: 'red' },
    { num: 6, color: 'black' }, { num: 7, color: 'red' }, { num: 8, color: 'black' },
    { num: 9, color: 'red' }, { num: 10, color: 'black' }
];
const rouletteTotalNumbers = rouletteNumbers.length;
const rouletteAnglePerSegment = 360 / rouletteTotalNumbers;
let currentRouletteBet = null;

if (rouletteWheelNumbersDiv) { // Check if element exists
    rouletteNumbers.forEach((item, index) => {
        const segment = document.createElement('div');
        segment.classList.add('wheel-segment', item.color);
        // segment.textContent = item.num; // Number will be in a span for better control

        const rotation = index * rouletteAnglePerSegment;
        // CSS-dəki .wheel-segment span üçün düzəlişləri nəzərə alaraq
        segment.style.transform = `rotate(${rotation}deg) skewY(${90 - rouletteAnglePerSegment}deg)`;

        const textSpan = document.createElement('span');
        textSpan.textContent = item.num;
        // CSS-dəki düzəlişlərə uyğunlaşdırmaq
        // The text span's own rotation will be primarily handled by its positioning and the parent's rotation.
        // We might need to counter-rotate slightly IF the skew makes text hard to read.
        // For simplicity, we'll rely on the CSS .wheel-segment span styling here.
        // The key is transform-origin on .wheel-segment and careful positioning/rotation of the span within.
        // Let's adjust the text span's rotation to be upright relative to the segment's top edge.
        const textRotation = -(90 - (rouletteAnglePerSegment / 2)); // Experimental value to make it look upright
        textSpan.style.transform = `skewY(-${90 - rouletteAnglePerSegment}deg) rotate(${textRotation + 90}deg) translateY(-130%) translateX(-50%)`; // Adjusted
        textSpan.style.position = 'absolute';
        textSpan.style.top = '0%'; // Position relative to the segment's own top edge
        textSpan.style.left = '50%';

        segment.appendChild(textSpan);
        rouletteWheelNumbersDiv.appendChild(segment);
    });
}


rouletteBetOptionButtons.forEach(button => {
    button.addEventListener('click', () => {
        currentRouletteBet = {
            type: button.dataset.betType,
            value: button.dataset.value
        };
        rouletteBetOptionButtons.forEach(btn => btn.style.border = '2px solid transparent');
        // Use a more robust way to check background color if needed, or just set based on knowns
        button.style.border = `2px solid ${button.dataset.value === 'black' ? 'var(--casino-gold)' : 'var(--casino-dark-bg)'}`;
        if(rouletteNumberBetInput) rouletteNumberBetInput.value = '';
        if(rouletteMessage) {
            rouletteMessage.textContent = `Mərciniz: ${button.textContent}`;
            rouletteMessage.className = 'message';
        }
    });
});

if (rouletteNumberBetInput) {
    rouletteNumberBetInput.addEventListener('input', () => {
        const numVal = parseInt(rouletteNumberBetInput.value);
        if (!isNaN(numVal) && numVal >= 0 && numVal <= 10) {
            currentRouletteBet = { type: 'number', value: numVal };
            rouletteBetOptionButtons.forEach(btn => btn.style.border = '2px solid transparent');
             if(rouletteMessage) {
                rouletteMessage.textContent = `Mərciniz: Nömrə ${numVal}`;
                rouletteMessage.className = 'message';
            }
        } else {
            currentRouletteBet = null;
        }
    });
}

if (spinRouletteButton) {
    spinRouletteButton.addEventListener('click', () => {
        const betAmount = parseInt(rouletteBetAmountInput.value);

        if (isNaN(betAmount) || betAmount <= 0) {
            if(rouletteMessage) {
                rouletteMessage.textContent = "Düzgün mərc məbləği daxil edin.";
                rouletteMessage.className = 'message lose';
            }
            return;
        }
        if (!currentRouletteBet) {
            if(rouletteMessage) {
                rouletteMessage.textContent = "Zəhmət olmasa, bir mərc seçin.";
                rouletteMessage.className = 'message lose';
            }
            return;
        }
        if (!updateBalance(-betAmount)) {
            if(rouletteMessage) {
                rouletteMessage.textContent = "Balansınızda kifayət qədər vəsait yoxdur!";
                rouletteMessage.className = 'message lose';
            }
            return;
        }

        spinRouletteButton.disabled = true;
        rouletteBetOptionButtons.forEach(b => b.disabled = true);
        if(rouletteNumberBetInput) rouletteNumberBetInput.disabled = true;
        if(rouletteResultDisplay) rouletteResultDisplay.textContent = "Fırlanır...";
        if(rouletteMessage) {
            rouletteMessage.textContent = "Nəticə gözlənilir...";
            rouletteMessage.className = 'message';
        }

        const randomIndex = Math.floor(Math.random() * rouletteTotalNumbers);
        const winningSegment = rouletteNumbers[randomIndex];

        const baseAngle = 360 * (3 + Math.floor(Math.random() * 2));
        // Target angle should align the *center* of the winning segment with the pointer
        // The pointer is at the top (0 degrees or 360 degrees on the wheel's rotation axis)
        // Each segment starts at index * anglePerSegment. The center is index * anglePerSegment + anglePerSegment / 2
        const targetAngle = - (randomIndex * rouletteAnglePerSegment + rouletteAnglePerSegment / 2);
        const totalRotation = baseAngle + targetAngle;

        if(rouletteWheelNumbersDiv) rouletteWheelNumbersDiv.style.transform = `rotate(${totalRotation}deg)`;

        setTimeout(() => {
            if(rouletteResultDisplay) rouletteResultDisplay.textContent = `Nəticə: ${winningSegment.num} (${winningSegment.color.charAt(0).toUpperCase() + winningSegment.color.slice(1)})`;
            let winnings = 0;
            let win = false;

            if (currentRouletteBet.type === 'color' && currentRouletteBet.value === winningSegment.color) {
                winnings = betAmount * 2; win = true;
            } else if (currentRouletteBet.type === 'parity') {
                const isEven = winningSegment.num % 2 === 0 && winningSegment.num !== 0;
                const isOdd = winningSegment.num % 2 !== 0;
                if ((currentRouletteBet.value === 'even' && isEven) || (currentRouletteBet.value === 'odd' && isOdd)) {
                    winnings = betAmount * 2; win = true;
                }
            } else if (currentRouletteBet.type === 'number' && currentRouletteBet.value === winningSegment.num) {
                winnings = betAmount * (rouletteTotalNumbers - 2); win = true; // Adjusted payout for straight number
            }

            if (win) {
                if(rouletteMessage) {
                    rouletteMessage.textContent = `QAZANDINIZ! +${winnings}$`;
                    rouletteMessage.className = 'message win';
                }
                updateBalance(winnings, true);
            } else {
                if(rouletteMessage) {
                    rouletteMessage.textContent = "Uduzduz. Yenidən cəhd edin.";
                    rouletteMessage.className = 'message lose';
                }
            }

            spinRouletteButton.disabled = false;
            rouletteBetOptionButtons.forEach(b => b.disabled = false);
            if(rouletteNumberBetInput) rouletteNumberBetInput.disabled = false;
            rouletteBetOptionButtons.forEach(btn => btn.style.border = '2px solid transparent');
            currentRouletteBet = null;

        }, 4200);
    });
}


// --- TAB SWITCHING LOGIC (from main.js, placed at the end) ---
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const gameContents = document.querySelectorAll('.game-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            gameContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            const gameId = button.getAttribute('data-game');
            const activeGameContent = document.getElementById(gameId);
            if (activeGameContent) {
                 activeGameContent.classList.add('active');
            }


            if (gameId === 'leaderboard-section') {
                renderLeaderboard(); // Ensure this is called after leaderboard elements are surely available
            }
        });
    });

    // Initial render for leaderboard if it's the default active tab (it's not, but good practice)
    if (document.getElementById('leaderboard-section') && document.getElementById('leaderboard-section').classList.contains('active')) {
        renderLeaderboard();
    }
     // Initialize first active tab's specific content if needed
    if (document.getElementById('slot-machine') && document.getElementById('slot-machine').classList.contains('active')) {
        // Any specific init for slot machine if it was deferred
    }
});
