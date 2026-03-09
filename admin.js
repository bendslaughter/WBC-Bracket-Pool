let officialResultsRowId = null;

async function fetchOfficialResults() {
  const { data, error } = await supabaseClient
    .from("official_results")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    console.error("Error loading official results:", error);
    return {
      id: null,
      group_results: {},
      knockout_results: {}
    };
  }

  officialResultsRowId = data.id;

  return {
    id: data.id,
    group_results: data.group_results || {},
    knockout_results: data.knockout_results || {}
  };
}

function loadOfficialResultsIntoState(results) {
  state.officialResults.groupGames = results.group_results || {};
  state.officialResults.knockoutGames = results.knockout_results || {};
}

function getOfficialStandings(group) {
  const standings = {};

  groups[group].forEach(team => {
    standings[team] = {
      team,
      wins: 0,
      losses: 0
    };
  });

  (games[group] || []).forEach(game => {
    const winner = state.officialResults.groupGames[game.id];
    if (!winner) return;

    const loser = winner === game.team1 ? game.team2 : game.team1;

    standings[winner].wins += 1;
    standings[loser].losses += 1;
  });

  return Object.values(standings).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.team.localeCompare(b.team);
  });
}

function renderOfficialStandings(group) {
  const tbody = document.getElementById(`table-${group}`);
  if (!tbody) return;

  const standings = getOfficialStandings(group);
  tbody.innerHTML = "";

  standings.forEach(team => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${team.team}</td>
      <td>${team.wins}</td>
      <td>${team.losses}</td>
    `;
    tbody.appendChild(row);
  });
}

function renderAllOfficialStandings() {
  Object.keys(groups).forEach(group => {
    renderOfficialStandings(group);
  });
}

function getOfficialTopTeams() {
  const result = {};

  Object.keys(groups).forEach(group => {
    const standings = getOfficialStandings(group);

    result[group] = {
      first: standings[0]?.team || null,
      second: standings[1]?.team || null
    };
  });

  return result;
}

function clearOfficialDependentPicks(matchId) {
  if (matchId === "qf1" || matchId === "qf2") {
    delete state.officialResults.knockoutGames.sf1;
    delete state.officialResults.knockoutGames.final;
  }

  if (matchId === "qf3" || matchId === "qf4") {
    delete state.officialResults.knockoutGames.sf2;
    delete state.officialResults.knockoutGames.final;
  }

  if (matchId === "sf1" || matchId === "sf2") {
    delete state.officialResults.knockoutGames.final;
  }
}

function buildAdminGames() {
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
      const selectedWinner = state.officialResults.groupGames[game.id];

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
          const currentWinner = state.officialResults.groupGames[gameId];

          if (currentWinner === selectedTeam) {
            delete state.officialResults.groupGames[gameId];
          } else {
            state.officialResults.groupGames[gameId] = selectedTeam;
          }

          state.officialResults.knockoutGames = {};
          buildAdminGames();
          renderAllOfficialStandings();
          updateAdminBracket();
        });
      });

      scheduleDiv.appendChild(row);
    });
  });
}

function renderAdminMatch(matchId, team1, team2) {
  const container = document.getElementById(matchId);
  if (!container) return;

  const selectedWinner = state.officialResults.knockoutGames[matchId];

  const placeholderValues = [
    "A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2",
    "QF1 Winner", "QF2 Winner", "QF3 Winner", "QF4 Winner",
    "SF1 Winner", "SF2 Winner"
  ];

  const team1Disabled = placeholderValues.includes(team1);
  const team2Disabled = placeholderValues.includes(team2);

  container.innerHTML = `
    <button
      class="team-btn ${selectedWinner === team1 ? "selected" : ""}"
      data-team="${team1}"
      ${team1Disabled ? "disabled" : ""}
    >
      ${team1}
    </button>

    <button
      class="team-btn ${selectedWinner === team2 ? "selected" : ""}"
      data-team="${team2}"
      ${team2Disabled ? "disabled" : ""}
    >
      ${team2}
    </button>
  `;

  const buttons = container.querySelectorAll(".team-btn");

  buttons.forEach(btn => {
    if (btn.disabled) return;

    btn.addEventListener("click", () => {
      const winner = btn.dataset.team;
      const currentWinner = state.officialResults.knockoutGames[matchId];

      if (currentWinner === winner) {
        delete state.officialResults.knockoutGames[matchId];
      } else {
        state.officialResults.knockoutGames[matchId] = winner;
      }

      clearOfficialDependentPicks(matchId);
      updateAdminBracket();
    });
  });
}

function updateAdminBracket() {
  const top = getOfficialTopTeams();
  const picks = state.officialResults.knockoutGames;

  renderAdminMatch("qf1", top.A?.first || "A1", top.B?.second || "B2");
  renderAdminMatch("qf2", top.B?.first || "B1", top.A?.second || "A2");
  renderAdminMatch("qf3", top.C?.first || "C1", top.D?.second || "D2");
  renderAdminMatch("qf4", top.D?.first || "D1", top.C?.second || "C2");

  renderAdminMatch("sf1", picks.qf1 || "QF1 Winner", picks.qf2 || "QF2 Winner");
  renderAdminMatch("sf2", picks.qf3 || "QF3 Winner", picks.qf4 || "QF4 Winner");

  renderAdminMatch("final", picks.sf1 || "SF1 Winner", picks.sf2 || "SF2 Winner");

  const championEl = document.getElementById("champion");
  if (championEl) {
    championEl.innerText = picks.final || "Champion";
  }
}

async function saveOfficialResults() {
  const status = document.getElementById("save-status");
  if (status) status.innerText = "Saving...";

  const payload = {
    group_results: state.officialResults.groupGames,
    knockout_results: state.officialResults.knockoutGames,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabaseClient
    .from("official_results")
    .update(payload)
    .eq("id", officialResultsRowId);

  if (error) {
    console.error("Error saving official results:", error);
    if (status) status.innerText = "Save failed";
    return;
  }

  if (status) status.innerText = "Saved";
}

function setupSaveButton() {
  const btn = document.getElementById("save-results");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    await saveOfficialResults();
  });
}

async function initAdminPage() {
  const results = await fetchOfficialResults();
  loadOfficialResultsIntoState(results);

  setupSaveButton();
  buildAdminGames();
  renderAllOfficialStandings();
  updateAdminBracket();
}

initAdminPage();