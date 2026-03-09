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

async function fetchOfficialResults() {
  const { data, error } = await supabaseClient
    .from("official_results")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    console.error("Error loading official results:", error);
    return {
      group_results: {},
      knockout_results: {}
    };
  }

  return {
    group_results: data.group_results || {},
    knockout_results: data.knockout_results || {}
  };
}

function loadEntryIntoState(entry) {
  state.currentEntry.name = entry.name || "";
  state.currentEntry.picks.groupGames = entry.group_picks || {};
  state.currentEntry.picks.knockoutGames = entry.knockout_picks || {};
}

function loadOfficialResultsIntoState(results) {
  state.officialResults.groupGames = results.group_results || {};
  state.officialResults.knockoutGames = results.knockout_results || {};
}

function calculateStandingsFromEntry(group) {
  const standings = {};

  groups[group].forEach(team => {
    standings[team] = {
      team,
      wins: 0,
      losses: 0
    };
  });

  (games[group] || []).forEach(game => {
    const winner = state.currentEntry.picks.groupGames[game.id];
    if (!winner) return;

    if (winner === game.team1) {
      standings[game.team1].wins += 1;
      standings[game.team2].losses += 1;
    } else if (winner === game.team2) {
      standings[game.team2].wins += 1;
      standings[game.team1].losses += 1;
    }
  });

  return Object.values(standings).sort((a, b) => {
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }

    return a.team.localeCompare(b.team);
  });
}

function renderStandingsForEntry(group) {
  const tbody = document.getElementById(`table-${group}`);
  if (!tbody) return;

  const standings = calculateStandingsFromEntry(group);
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

function renderAllStandingsForEntry() {
  Object.keys(groups).forEach(group => {
    renderStandingsForEntry(group);
  });
}

function getTopTeamsFromEntry() {
  const result = {};

  Object.keys(groups).forEach(group => {
    const standings = calculateStandingsFromEntry(group);

    result[group] = {
      first: standings[0]?.team || null,
      second: standings[1]?.team || null
    };
  });

  return result;
}

function getPickClass(selectedWinner, officialWinner, team) {
  if (selectedWinner !== team) return "";

  if (!officialWinner) return "selected";
  if (officialWinner === team) return "correct-pick";

  return "incorrect-pick";
}

function getPickIconMarkup(selectedWinner, officialWinner, team) {
  if (selectedWinner !== team) return "";
  if (!officialWinner) return "";

  if (officialWinner === team) {
    return `<i data-lucide="check" class="result-icon"></i>`;
  }

  return `<i data-lucide="x" class="result-icon"></i>`;
}

function renderLucideIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
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
      const officialWinner = state.officialResults.groupGames[game.id];

      const team1Class = getPickClass(selectedWinner, officialWinner, game.team1);
      const team2Class = getPickClass(selectedWinner, officialWinner, game.team2);

      const team1Icon = getPickIconMarkup(selectedWinner, officialWinner, game.team1);
      const team2Icon = getPickIconMarkup(selectedWinner, officialWinner, game.team2);

      const row = document.createElement("div");
      row.className = "game-row";

      row.innerHTML = `
        <div class="game-date">${game.date}</div>

        <button
          class="team-btn team1 ${team1Class}"
          disabled
        >
          ${game.team1}
          ${team1Icon}
        </button>

        <div class="vs">vs</div>

        <button
          class="team-btn team2 ${team2Class}"
          disabled
        >
          ${game.team2}
          ${team2Icon}
        </button>
      `;

      scheduleDiv.appendChild(row);
    });
  });

  renderLucideIcons();
}

function renderReadOnlyMatch(matchId, team1, team2) {
  const container = document.getElementById(matchId);
  if (!container) return;

  const selectedWinner = state.currentEntry.picks.knockoutGames[matchId];
  const officialWinner = state.officialResults.knockoutGames[matchId];

  const team1Class = getPickClass(selectedWinner, officialWinner, team1);
  const team2Class = getPickClass(selectedWinner, officialWinner, team2);

  const team1Icon = getPickIconMarkup(selectedWinner, officialWinner, team1);
  const team2Icon = getPickIconMarkup(selectedWinner, officialWinner, team2);

  container.innerHTML = `
    <button class="team-btn ${team1Class}" disabled>
      ${team1}
      ${team1Icon}
    </button>

    <button class="team-btn ${team2Class}" disabled>
      ${team2}
      ${team2Icon}
    </button>
  `;
}

function updateReadOnlyBracket() {
  const top = getTopTeamsFromEntry();
  const picks = state.currentEntry.picks.knockoutGames;

  renderReadOnlyMatch("qf1", top.A?.first || "A1", top.B?.second || "B2");
  renderReadOnlyMatch("qf2", top.B?.first || "B1", top.A?.second || "A2");
  renderReadOnlyMatch("qf3", top.C?.first || "C1", top.D?.second || "D2");
  renderReadOnlyMatch("qf4", top.D?.first || "D1", top.C?.second || "C2");

  renderReadOnlyMatch("sf1", picks.qf1 || "QF1 Winner", picks.qf2 || "QF2 Winner");
  renderReadOnlyMatch("sf2", picks.qf3 || "QF3 Winner", picks.qf4 || "QF4 Winner");

  renderReadOnlyMatch("final", picks.sf1 || "SF1 Winner", picks.sf2 || "SF2 Winner");

  const championEl = document.getElementById("champion");
  if (championEl) {
    championEl.innerText = picks.final || "Champion";
  }

  renderLucideIcons();
}

async function initBracketView() {
  const entryId = getEntryIdFromUrl();

  if (!entryId) {
    document.getElementById("bracket-page-title").innerText = "Bracket not found";
    return;
  }

  const entry = await fetchEntryById(entryId);
  const officialResults = await fetchOfficialResults();

  if (!entry) {
    document.getElementById("bracket-page-title").innerText = "Bracket not found";
    return;
  }

  document.getElementById("bracket-page-title").innerText = `${entry.name}'s Bracket`;

  loadEntryIntoState(entry);
  loadOfficialResultsIntoState(officialResults);

  buildReadOnlyGames();
  renderAllStandingsForEntry();
  updateReadOnlyBracket();
}

initBracketView();