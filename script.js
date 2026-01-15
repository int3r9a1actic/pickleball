// Wrap everything in an "init" function to ensure the page is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    let players = JSON.parse(localStorage.getItem('pb-players')) || [];
    let waitCounts = JSON.parse(localStorage.getItem('pb-waitCounts')) || {};

    const nameInput = document.getElementById('playerNameInput');
    const addBtn = document.getElementById('addBtn');
    const playerForm = document.getElementById('playerForm');

    // Initial Render
    renderPlayerList();

    // 1. Handle Button Click
    addBtn.addEventListener('click', function() {
        processNewPlayer();
    });

    // 2. Handle Mobile Keyboard "Enter" or "Go"
    playerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        processNewPlayer();
    });

    function processNewPlayer() {
        const name = nameInput.value.trim();
        
        if (!name) return;

        // Check for duplicates
        const exists = players.some(p => p.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            alert("Name already exists!");
            return;
        }

        // Add to data
        players.push({ name: name, active: true });
        
        // Clear and keep focus for fast entry
        nameInput.value = '';
        nameInput.focus();
        
        saveAndRender();
    }

    function saveAndRender() {
        localStorage.setItem('pb-players', JSON.stringify(players));
        localStorage.setItem('pb-waitCounts', JSON.stringify(waitCounts));
        renderPlayerList();
    }

    // Exporting functions to window so the HTML buttons can still see them
    window.sortPlayers = function() {
        players.sort((a, b) => a.name.localeCompare(b.name));
        saveAndRender();
    };

    window.toggleAll = function(status) {
        players.forEach(p => p.active = status);
        saveAndRender();
    };

    window.togglePlayer = function(index) {
        players[index].active = !players[index].active;
        saveAndRender();
    };

    window.removePlayer = function(index) {
        const name = players[index].name;
        players.splice(index, 1);
        delete waitCounts[name];
        saveAndRender();
    };

    function renderPlayerList() {
        const listDiv = document.getElementById('playerCheckboxList');
        const countDisplay = document.getElementById('activeCountDisplay');
        if (!listDiv) return;

        listDiv.innerHTML = '';
        let activeCount = 0;

        players.forEach((p, index) => {
            if (p.active) activeCount++;
            const item = document.createElement('div');
            item.className = 'player-item';
            item.innerHTML = `
                <input type="checkbox" ${p.active ? 'checked' : ''} onchange="togglePlayer(${index})">
                <span onclick="togglePlayer(${index})" style="flex:1; cursor:pointer">${p.name}</span>
                <button class="remove-btn" onclick="removePlayer(${index})">&times;</button>
            `;
            listDiv.appendChild(item);
        });
        if (countDisplay) countDisplay.innerText = `Checked: ${activeCount}`;
    }

    window.generateNextRound = function() {
        let activePool = players.filter(p => p.active).map(p => p.name);
        const numCourts = parseInt(document.getElementById('courtCount').value) || 1;

        if (activePool.length < 4) {
            alert("Select at least 4 players!");
            return;
        }

        activePool.forEach(name => { if (!waitCounts[name]) waitCounts[name] = 0; });

        let pool = activePool.sort(() => Math.random() - 0.5);
        pool.sort((a, b) => (waitCounts[b] || 0) - (waitCounts[a] || 0));

        const playingCount = Math.floor(pool.length / 4) * 4;
        const finalPlayingCount = Math.min(playingCount, numCourts * 4);
        
        const playingNow = pool.slice(0, finalPlayingCount);
        const benched = pool.slice(finalPlayingCount);

        playingNow.forEach(name => waitCounts[name] = 0);
        benched.forEach(name => waitCounts[name] += 1);

        saveAndRender();
        displayRound(playingNow, benched);
    };

    function displayRound(active, benched) {
        const output = document.getElementById('roundOutput');
        let html = `<div class="round-card"><h3>Rounds</h3>`;
        for (let i = 0; i < active.length; i += 4) {
            html += `<div class="court"><strong>Court ${(i/4)+1}:</strong> ${active[i]} & ${active[i+1]} vs ${active[i+2]} & ${active[i+3]}</div>`;
        }
        if (benched.length > 0) {
            html += `<div class="bench"><strong>Next Up:</strong> ${benched.join(", ")}</div>`;
        }
        html += `</div>`;
        output.insertAdjacentHTML('afterbegin', html);
    }

    window.clearHistory = function() {
        if (confirm("Clear rounds?")) document.getElementById('roundOutput').innerHTML = '';
    };
});
