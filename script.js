let waitCounts = JSON.parse(localStorage.getItem('pb-waitCounts')) || {};
let countdown;
let timerRunning = false;
let timeLeft;

const playerInput = document.getElementById('playerList');

// Load saved names
if (localStorage.getItem('pb-players')) {
    playerInput.value = localStorage.getItem('pb-players');
}

function generateNextRound() {
    const input = playerInput.value;
    const courtInput = document.getElementById('courtCount');
    let numCourts = parseInt(courtInput.value) || 1;

    if (numCourts > 5) numCourts = 5;
    if (numCourts < 1) numCourts = 1;

    let players = input.split('\n').map(p => p.trim()).filter(p => p !== "");
    
    if (players.length < 4) {
        alert("You need at least 4 players!");
        return;
    }

    localStorage.setItem('pb-players', input);

    players.forEach(p => { 
        if (waitCounts[p] === undefined) waitCounts[p] = 0; 
    });

    let pool = players.sort(() => Math.random() - 0.5);
    pool.sort((a, b) => (waitCounts[b] || 0) - (waitCounts[a] || 0));

    const totalCapacity = numCourts * 4;
    const actualPlayingCount = Math.min(pool.length - (pool.length % 2), totalCapacity);
    
    const activePlayers = pool.slice(0, actualPlayingCount);
    const benchedPlayers = pool.slice(actualPlayingCount);

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
        if (p1 && p2 && p3 && p4) {
            html += `<div class="court"><strong>Court ${(i/4)+1}:</strong> ${p1} & ${p2} vs ${p3} & ${p4}</div>`;
        } else if (p1 && p2) {
            html += `<div class="court"><strong>Court ${(i/4)+1}:</strong> ${p1} & ${p2} (Wait)</div>`;
        }
    }

    if (benched.length > 0) {
        html += `<div class="bench"><strong>Next Up:</strong> ${benched.join(", ")}</div>`;
    }
    
    html += `</div>`;
    output.innerHTML = html + output.innerHTML;
}

// TIMER LOGIC
function toggleTimer() {
    const display = document.getElementById('timerDisplay');
    const btn = document.getElementById('timerBtn');
    const minsInput = document.getElementById('timerMins');
    const alarm = document.getElementById('alarmSound');

    if (timerRunning) return;

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
            alarm.play();
            alert("Time is up!");
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
    if (confirm("Reset all player data and history?")) {
        localStorage.clear();
        location.reload();
    }
}