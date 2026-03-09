function getEntryIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function fetchEntryById(entryId) {
  const { data, error } = await supabaseClient
    .from("entries")
    .select("*")
    .eq("id", entryId)
    .single();

  if (error) {
    console.error("Error loading entry:", error);
    return null;
  }

  return data;
}

function loadEntryIntoState(entry) {
  state.currentEntry.name = entry.name || "";
  state.currentEntry.picks.groupGames = entry.group_picks || {};
  state.currentEntry.picks.knockoutGames = entry.knockout_picks || {};
}

function buildReadOnlyGames() {
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
          disabled
        >
          ${game.team1}
        </button>

        <div class="vs">vs</div>

        <button
          class="team-btn team2 ${selectedWinner === game.team2 ? "selected" : ""}"
          disabled
        >
          ${game.team2}
        </button>
      `;

      scheduleDiv.appendChild(row);
    });
  });
}

function renderReadOnlyMatch(matchId, team1, team2) {
  const container = document.getElementById(matchId);
  if (!container) return;

  const selectedWinner = state.currentEntry.picks.knockoutGames[matchId];

  container.innerHTML = `
    <button class="team-btn ${selectedWinner === team1 ? "selected" : ""}" disabled>
      ${team1}
    </button>
    <button class="team-btn ${selectedWinner === team2 ? "selected" : ""}" disabled>
      ${team2}
    </button>
  `;
}

function updateReadOnlyBracket() {
  const top = getTopTeams();
  const picks = state.currentEntry.picks.knockoutGames;

  renderReadOnlyMatch("qf1", top.A?.first || "A1", top.B?.second || "B2");
  renderReadOnlyMatch("qf2", top.B?.first || "B1", top.A?.second || "A2");
  renderReadOnlyMatch("qf3", top.C?.first || "C1", top.D?.second || "D2");
  renderReadOnlyMatch("qf4", top.D?.first || "D1", top.C?.second || "C2");

  renderReadOnlyMatch("sf1", picks.qf1 || "QF1 Winner", picks.qf2 || "QF2 Winner");
  renderReadOnlyMatch("sf2", picks.qf3 || "QF3 Winner", picks.qf4 || "QF4 Winner");

  renderReadOnlyMatch("final", picks.sf1 || "SF1 Winner", picks.sf2 || "SF2 Winner");

  document.getElementById("champion").innerText = picks.final || "Champion";
}

async function initBracketView() {
  const entryId = getEntryIdFromUrl();

  if (!entryId) {
    document.getElementById("bracket-page-title").innerText = "Bracket not found";
    return;
  }

  const entry = await fetchEntryById(entryId);

  if (!entry) {
    document.getElementById("bracket-page-title").innerText = "Bracket not found";
    return;
  }

  document.getElementById("bracket-page-title").innerText = `${entry.name}'s Bracket`;

  loadEntryIntoState(entry);
  buildReadOnlyGames();
  renderAllStandings();
  updateReadOnlyBracket();
}

initBracketView();