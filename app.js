function saveState() {
  localStorage.setItem("wbcState", JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem("wbcState");
  if (!saved) return;

  const parsed = JSON.parse(saved);

  if (parsed.currentEntry) {
    state.currentEntry.name = parsed.currentEntry.name || "";
    state.currentEntry.picks.groupGames = parsed.currentEntry.picks?.groupGames || {};
    state.currentEntry.picks.knockoutGames = parsed.currentEntry.picks?.knockoutGames || {};
  }

  if (parsed.entries) {
    state.entries = parsed.entries;
  }
}


function setupEntryName() {

  const input = document.getElementById("entry-name");
  if (!input) return;

  input.value = state.currentEntry.name || "";

  input.addEventListener("input", (e) => {
    state.currentEntry.name = e.target.value;
    saveState();
  });

}


function setupSubmitButton() {

  const btn = document.getElementById("submit-entry");
  if (!btn) return;

  btn.addEventListener("click", () => {

    if (!state.currentEntry.name) {
      alert("Please enter your name before submitting.");
      return;
    }

    const entry = {
      name: state.currentEntry.name,
      picks: JSON.parse(JSON.stringify(state.currentEntry.picks)),
      submittedAt: new Date().toISOString()
    };

    state.entries.push(entry);

    saveState();

    alert("Bracket submitted!");

  });

}


function clearKnockoutPicks() {
  state.currentEntry.picks.knockoutGames = {};
}


function buildGames() {

  const container = document.getElementById("games");
  if (!container) return;

  container.innerHTML = "";

  Object.keys(games).forEach(group => {

    const groupWrapper = document.createElement("div");
    groupWrapper.className = "group-box";

    groupWrapper.innerHTML = `
      <h2>Group ${group}</h2>

      <div class="group-schedule">
        <div id="schedule-${group}"></div>
      </div>

      <div class="group-standings">
        <table>
          <thead>
            <tr>
              <th>Team</th>
              <th>W</th>
              <th>L</th>
            </tr>
          </thead>
          <tbody id="table-${group}"></tbody>
        </table>
      </div>
    `;

    container.appendChild(groupWrapper);

    const scheduleDiv = document.getElementById(`schedule-${group}`);

    games[group].forEach(game => {

      const selectedWinner = state.currentEntry.picks.groupGames[game.id];

      const row = document.createElement("div");
      row.className = "game-row";

      row.innerHTML = `
        <div class="game-date">${game.date}</div>

        <button
          class="team-btn team1 ${selectedWinner === game.team1 ? "selected" : ""}"
          data-game-id="${game.id}"
          data-team="${game.team1}"
        >
          ${game.team1}
        </button>

        <div class="vs">vs</div>

        <button
          class="team-btn team2 ${selectedWinner === game.team2 ? "selected" : ""}"
          data-game-id="${game.id}"
          data-team="${game.team2}"
        >
          ${game.team2}
        </button>
      `;

      const buttons = row.querySelectorAll(".team-btn");

      buttons.forEach(btn => {

        btn.addEventListener("click", () => {

          const gameId = btn.dataset.gameId;
          const selectedTeam = btn.dataset.team;

          const currentWinner = state.currentEntry.picks.groupGames[gameId];

          if (currentWinner === selectedTeam) {
            delete state.currentEntry.picks.groupGames[gameId];
          } else {
            state.currentEntry.picks.groupGames[gameId] = selectedTeam;
          }

          clearKnockoutPicks();
          saveState();

          buildGames();
          renderAllStandings();
          updateBracket();

        });

      });

      scheduleDiv.appendChild(row);

    });

  });

}


function init() {

  loadState();

  setupEntryName();
  setupSubmitButton();

  buildGames();
  renderAllStandings();
  updateBracket();

}

init();