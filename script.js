let waitCounts = JSON.parse(localStorage.getItem('pb-waitCounts')) || {};
let countdown;
let timerRunning = false;
let timeLeft;

const playerInput = document.getElementById('playerList');
const alarm = document.getElementById('alarmSound');

// Load saved names from previous session
if (localStorage.getItem('pb-players')) {
    playerInput.value = localStorage.getItem('pb-players');
}

/**
 * CORE LOGIC: ALLOCATE PLAYERS TO COURTS
 */
function generateNextRound() {
    const input = playerInput.value;
    const courtInput = document.getElementById('courtCount');
    let numCourts = parseInt(courtInput.value) || 1;

    // Constrain court count between 1 and 5
    if (numCourts > 5) numCourts = 5;
    if (numCourts < 1) numCourts = 1;

    let players = input.split('\n').map(p => p.trim()).filter(p => p !== "");
    
    if (players.length < 4) {
        alert("You need at least 4 players to start!");
        return;
    }

    localStorage.setItem('pb-players', input);

    // Initialize tracking for any new names added
    players.forEach(p => { 
        if (waitCounts[p] === undefined) waitCounts[p] = 0; 
    });

    // 1. Shuffle for variety
    let pool = players.sort(() => Math.random() - 0.5);
    
    // 2. Sort by waitCount (High waitCount = sat out last round, so they play first)
    pool.sort((a, b) => (waitCounts[b] || 0) - (waitCounts[a] || 0));

    const totalCapacity = numCourts * 4;
    
    // Logic: We play in pairs. If we have 11 players for 3 courts (12 spots), 
    // we take the top 8 (2 full courts) or top 10 (2 courts + 1 practice court).
    // This ensures no one is left alone on a court.
    const actualPlayingCount = Math.min(pool.length - (pool.length % 2), totalCapacity);
    
    const activePlayers = pool.slice(0, actualPlayingCount);
    const benchedPlayers = pool.slice(actualPlayingCount);

    // Update wait history: Playing resets to 0, Benched increases by 1
    activePlayers.forEach(p => waitCounts[p] = 0);
    benchedPlayers.forEach(p => waitCounts[p] += 1);

    localStorage.setItem('pb-waitCounts', JSON.stringify(waitCounts));
    displayRound(activePlayers, benchedPlayers);
}

function displayRound(active, benched) {
    const output = document.getElementById('roundOutput');
    const roundCount = document.querySelectorAll('.round-card').length + 1;
    
    let html = `<div class="round-card"><h3>Round ${roundCount}</h3>`;
    
    for (let i = 0; i < active.length; i += 4) {
        let p1 = active[i], p2 = active[i+1], p3 = active[i+2], p4 = active[i+3];
        let courtNum = (i/4)+1;

        if (p1 && p2 && p3 && p4) {
            html += `<div class="court"><strong>Court ${courtNum}:</strong> ${p1} & ${p2} <span style="color:#777">vs</span> ${p3} & ${p4}</div>`;
        } else if (p1 && p2) {
            html += `<div class="court"><strong>Court ${courtNum}:</strong> ${p1} & ${p2} <span style="color:#777">(Waiting for opponents)</span></div>`;
        }
    }

    if (benched.length > 0) {
        html += `<div class="bench"><strong>Next Up (Sitting Out):</strong> ${benched.join(", ")}</div>`;
    }
    
    html += `</div>`;
    output.innerHTML = html + output.innerHTML;
}

/**
 * TIMER LOGIC: WITH ANDROID FIXES
 */
function toggleTimer() {
    const display = document.getElementById('timerDisplay');
    const btn = document.getElementById('timerBtn');
    const minsInput = document.getElementById('timerMins');

    if (timerRunning) return;

    // --- ANDROID AUDIO FIX ---
    // Browsers block sound unless played during a user click.
    // We play and immediately pause/reset to "unlock" the audio for later.
    alarm.play().then(() => {
        alarm.pause();
        alarm.currentTime = 0;
    }).catch(e => console.log("Audio prep failed (normal for some browsers):", e));

    if (timeLeft === undefined || timeLeft <= 0) {
        timeLeft = parseInt(minsInput.value) * 60;
    }

    timerRunning = true;
    btn.innerText = "Running";
    btn.disabled = true;
    btn.style.opacity = "0.6";

    countdown = setInterval(() => {
        timeLeft--;
        let m = Math.floor(timeLeft / 60);
        let s = timeLeft % 60;
        display.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;

        if (timeLeft <= 0) {
            clearInterval(countdown);
            
            // Alarm & Vibration
            alarm.currentTime = 0; 
            alarm.play();
            if (navigator.vibrate) navigator.vibrate([500, 200, 500]);

            alert("Time is up! Rotate players.");
            resetTimerClock();
        }
    }, 1000);
}

function pauseTimer() {
    const btn = document.getElementById('timerBtn');
    clearInterval(countdown);
    timerRunning = false;
    btn.disabled = false;
    btn.style.opacity = "1";
    btn.innerText = "Resume";
}

function resetTimerClock() {
    const display = document.getElementById('timerDisplay');
    const btn = document.getElementById('timerBtn');
    const minsInput = document.getElementById('timerMins');
    
    clearInterval(countdown);
    timerRunning = false;
    timeLeft = parseInt(minsInput.value) * 60;
    
    display.innerText = minsInput.value + ":00";
    btn.disabled = false;
    btn.style.opacity = "1";
    btn.innerText = "Start";
}

function resetSession() {
    if (confirm("This will clear all players and history. Continue?")) {
        localStorage.clear();
        location.reload();
    }
}
