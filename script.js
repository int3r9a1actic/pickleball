let players = JSON.parse(localStorage.getItem('pb-players')) || [];
let waitCounts = JSON.parse(localStorage.getItem('pb-waitCounts')) || {};

// Initialize
renderPlayerList();

function addPlayer() {
    const input = document.getElementById('playerNameInput');
    const name = input.value.trim();
    if (name) {
        // Prevent duplicate names
        if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            alert("Player already in list.");
            return;
        }
        players.push({ name: name, active: true });
        input.value = '';
        saveAndRender();
    }
}

function sortPlayers() {
    players.sort((a, b) => a.name.localeCompare(b.name));
    saveAndRender();
}

function toggleAll(status) {
    players.forEach(p => p.active = status);
    saveAndRender();
}

function togglePlayer(index) {
    players[index].active = !players[index].active;
    saveAndRender();
}

function removePlayer(index) {
    const name = players[index].name;
    players.splice(index, 1);
    delete waitCounts[name];
    saveAndRender();
}

function saveAndRender() {
    localStorage.setItem('pb-players', JSON.stringify(players));
    localStorage.setItem('pb-waitCounts', JSON.stringify(waitCounts));
    renderPlayerList();
}

function renderPlayerList() {
    const listDiv = document.getElementById('playerCheckboxList');
    listDiv.innerHTML = '';
    players.forEach((p, index) => {
        listDiv.innerHTML += `
            <div class="player-item">
                <input type="checkbox" ${p.active ? 'checked' : ''} onchange="togglePlayer(${index})">
                <span>${p.name}</span>
                <button class="remove-btn" onclick="removePlayer(${index})">&times;</button>
            </div>
        `;
    });
}

function generateNextRound() {
    let activePool = players.filter(p => p.active).map(p => p.name);
    const numCourts = parseInt(document.getElementById('courtCount').value) || 1;

    if (activePool.length < 4) {
        alert("Select at least 4 players!");
        return;
    }

    // Prepare wait list
    activePool.forEach(name => { if (waitCounts[name] === undefined) waitCounts[name] = 0; });

    // Shuffle then Sort by Priority (Benched players move to top)
    let pool = activePool.sort(() => Math.random() - 0.5);
    pool.sort((a, b) => (waitCounts[b] || 0) - (waitCounts[a] || 0));

    const totalCapacity = numCourts * 4;
    const actualPlayingCount = Math.min(pool.length - (pool.length % 2), totalCapacity);
    
    const playingNow = pool.slice(0, actualPlayingCount);
    const benched = pool.slice(actualPlayingCount);

    // Update wait counts
    playingNow.forEach(name => waitCounts[name] = 0);
    benched.forEach(name => waitCounts[name] += 1);

    localStorage.setItem('pb-waitCounts', JSON.stringify(waitCounts));
    displayRound(playingNow, benched);
}

function displayRound(active, benched) {
    const output = document.getElementById('roundOutput');
    const roundCount = document.querySelectorAll('.round-card').length + 1;
    let html = `<div class="round-card"><h3>Round ${roundCount}</h3>`;
    
    for (let i = 0; i < active.length; i += 4) {
        let p1 = active[i], p2 = active[i+1], p3 = active[i+2], p4 = active[i+3];
        let courtNum = (i/4)+1;
        if (p1 && p2 && p3 && p4) {
            html += `<div class="court"><strong>Court ${courtNum}:</strong> ${p1} & ${p2} vs ${p3} & ${p4}</div>`;
        } else if (p1 && p2) {
            html += `<div class="court"><strong>Court ${courtNum}:</strong> ${p1} & ${p2} (Wait)</div>`;
        }
    }

    if (benched.length > 0) {
        html += `<div class="bench"><strong>Benched:</strong> ${benched.join(", ")}</div>`;
    }
    
    html += `</div>`;
    output.innerHTML = html + output.innerHTML;
}

function clearHistory() {
    if (confirm("Clear all round history but keep players?")) {
        document.getElementById('roundOutput').innerHTML = '';
    }
}

function resetSession() {
    if (confirm("Wipe EVERYTHING (all players and rounds)?")) {
        localStorage.clear();
        location.reload();
    }
}
