// Shared Game Logic and Utilities

// Sound Effects
const sounds = {
    correct: new Audio('sounds/correct.mp3'),
    wrong: new Audio('sounds/wrong.mp3')
};

// Preload sounds
for (let key in sounds) {
    sounds[key].load();
}

function playSound(type) {
    if (sounds[type]) {
        // Reset time to 0 to allow rapid replaying
        sounds[type].currentTime = 0;
        sounds[type].play().catch(e => console.log("Audio play failed interaction needed:", e));
    }
}

// Navigation
function navigateTo(page) {
    window.location.href = page;
}

// Helper: Random Number in range [min, max)
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// Helper: Shuffle Array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Game State
let currentCorrectAnswer = 0;
let score = 0;
let level = 1; // Adaptive level

function updateScore() {
    score++;
    const scoreEl = document.getElementById('score');
    if (scoreEl) {
        scoreEl.innerText = score;
        scoreEl.classList.remove('score-animate');
        void scoreEl.offsetWidth; // Trigger reflow to restart animation
        scoreEl.classList.add('score-animate');
    }

    // Simple adaptive logic: Increase level every 3 points
    if (score % 3 === 0 && score > 0) {
        level++;
        console.log("Level Up! New Level:", level);
    }
}

// AI Integration
async function fetchQuestionFromAI(type) {
    const questionEl = document.getElementById('question');
    if (questionEl) questionEl.innerHTML = "Thinking... 🤖";

    try {
        const response = await fetch('/api/generate-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ level: level, theme: "fun", type: type })
        });

        const data = await response.json();
        if (data.ok && data.ai) {
            return data.ai;
        } else {
            throw new Error(data.error || "Unknown error");
        }
    } catch (e) {
        console.warn("AI generation failed or offline, using fallback.", e);
        return null; // Signal to use fallback
    }
}

// Addition Game Logic
async function startAdditionGame() {
    // Try AI first
    const aiData = await fetchQuestionFromAI('addition');

    if (aiData) {
        // Use AI Question
        currentCorrectAnswer = aiData.answer;
        const questionEl = document.getElementById('question');
        if (questionEl) {
            questionEl.innerHTML = aiData.question;
        }
        renderOptions(aiData.choices, currentCorrectAnswer);
    } else {
        // Fallback Procedural Logic
        const max = level * 10 + 5; // Scale difficulty with level roughly
        const num1 = getRandomNumber(1, max);
        const num2 = getRandomNumber(1, max);
        currentCorrectAnswer = num1 + num2;

        const questionEl = document.getElementById('question');
        if (questionEl) {
            questionEl.innerHTML = `${num1} + ${num2} = ?`;
        }
        generateFallbackOptions(currentCorrectAnswer);
    }

    clearMessage();
}

// Subtraction Game Logic
async function startSubtractionGame() {
    // Try AI first
    const aiData = await fetchQuestionFromAI('subtraction');

    if (aiData) {
        currentCorrectAnswer = aiData.answer;
        const questionEl = document.getElementById('question');
        if (questionEl) {
            questionEl.innerHTML = aiData.question;
        }
        renderOptions(aiData.choices, currentCorrectAnswer);
    } else {
        // Fallback
        const max = level * 10 + 10;
        let num1 = getRandomNumber(1, max);
        let num2 = getRandomNumber(1, max);

        if (num1 < num2) [num1, num2] = [num2, num1]; // Ensure positive

        currentCorrectAnswer = num1 - num2;

        const questionEl = document.getElementById('question');
        if (questionEl) {
            questionEl.innerHTML = `${num1} - ${num2} = ?`;
        }
        generateFallbackOptions(currentCorrectAnswer);
    }
    clearMessage();
}

// Render Options (Generic)
function renderOptions(optionsArray, correct) {
    const optionsContainer = document.getElementById('options');
    if (!optionsContainer) return;
    optionsContainer.innerHTML = '';

    const shuffled = shuffleArray(optionsArray);
    shuffled.forEach(option => {
        const btn = document.createElement('button');
        btn.textContent = option;
        btn.className = 'btn option-btn';
        btn.onclick = () => checkAnswer(option, correct);
        optionsContainer.appendChild(btn);
    });
}

// Legacy fallback option generator
function generateFallbackOptions(correct) {
    const options = new Set();
    options.add(correct);
    while (options.size < 3) {
        let distractor = correct + getRandomNumber(-5, 6);
        if (distractor >= 0 && distractor !== correct) {
            options.add(distractor);
        }
    }
    renderOptions(Array.from(options), correct);
}

function checkAnswer(userAnswer, correct) {
    const messageEl = document.getElementById('message');

    if (userAnswer === correct) {
        playSound('correct');
        updateScore();
        messageEl.className = 'feedback-msg correct';
        messageEl.innerText = "Yay! Correct Answer!";

        // Wait a bit then restart
        setTimeout(() => {
            // Determine which game we are in based on URL or generic check
            if (window.location.href.includes('addition')) startAdditionGame();
            else if (window.location.href.includes('subtraction')) startSubtractionGame();
        }, 1500);
    } else {
        playSound('wrong');
        messageEl.className = 'feedback-msg wrong';
        messageEl.innerText = "Oops! Try again.";
    }
}

function clearMessage() {
    const messageEl = document.getElementById('message');
    if (messageEl) {
        messageEl.innerText = "";
        messageEl.className = 'feedback-msg';
    }
}

// Auto-start game if on game pages
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.href.includes('addition')) {
        startAdditionGame();
    } else if (window.location.href.includes('subtraction')) {
        startSubtractionGame();
    } else if (window.location.href.includes('numbers')) {
        startNumberGame();
    }
});

// Number Guessing Game Logic
let targetNumber = 0;

function startNumberGame() {
    targetNumber = getRandomNumber(1, 6); // 1 to 5
    const feedbackEl = document.getElementById('para');
    if (feedbackEl) feedbackEl.innerHTML = "|";

    const inputEl = document.getElementById('userGuess');
    if (inputEl) {
        inputEl.value = '';
        inputEl.disabled = false;
        inputEl.focus();
    }

    // Reset any previous "Play Again" view if needed
    const cont = document.getElementById("cont");
    const originalContent = `
        <div class="scoreboard">
            <span>Score:</span>
            <span id="score" class="score-value">${score}</span>
        </div>
        <h1 style="color: var(--accent-color); text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">Guess the Number!</h1>

        <p>I'm thinking of a number between 1 and 5.</p>

        <div style="margin: 20px 0;">
            <input type="number" id="userGuess" class="number-input" placeholder="?" min="1" max="5">
        </div>

        <p id="para" class="feedback-msg">|</p>

        <button onclick="checkNumberGuess()" class="btn btn-primary">Submit Guess</button>
    `;

    // Only reset if we are not in initial state (simple check)
    if (!document.getElementById('userGuess')) {
        cont.innerHTML = originalContent;
        // Re-attach event listener
        document.getElementById("userGuess").addEventListener("keyup", (e) => {
            if (e.key === "Enter") {
                checkNumberGuess();
            }
        });
    }

}

function checkNumberGuess() {
    const inputEl = document.getElementById('userGuess');
    const feedbackEl = document.getElementById('para');
    const userGuess = parseInt(inputEl.value);

    if (isNaN(userGuess)) {
        feedbackEl.innerHTML = "<span style='color: var(--error)'>Please enter a number!</span>";
        return;
    }

    if (userGuess === targetNumber) {
        playSound('correct');
        updateScore();

        const numSound = new Audio(`sounds/${targetNumber}.mp3`);
        numSound.play().catch(() => { });

        const cont = document.getElementById("cont");
        cont.innerHTML = `
            <div class="scoreboard">
                <span>Score:</span>
                <span id="score" class="score-value">${score}</span>
            </div>
            <h1>Math with Fun!</h1>
            <div class="glass-container" style="margin: 0 auto; box-shadow: none; border: none; background: transparent;">
                <p>Congratulations! You guessed the correct number: ${targetNumber}</p>
                <img src="fireworks.gif" style="width: 200px; border-radius: 10px;"><br><br>
                <button onclick="startNumberGame()" class="btn btn-primary">Play Again</button>
            </div>
        `;
    } else {
        playSound('wrong');
        feedbackEl.innerHTML = `<span style='color: var(--error)'>Try again! It's not ${userGuess}.</span>`;
        if (inputEl) {
            inputEl.value = '';
            inputEl.focus();
        }
    }
}
