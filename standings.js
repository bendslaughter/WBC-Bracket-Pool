function findGameById(gameId) {
  for (const group of Object.keys(games)) {
    const game = games[group].find(g => g.id === gameId);
    if (game) return game;
  }

  return null;
}

function getGroupGames(group) {
  return games[group] || [];
}

function getGroupPicks(group) {
  const picks = state.currentEntry.picks.groupGames || {};
  const groupGameIds = getGroupGames(group).map(game => game.id);

  const result = {};

  groupGameIds.forEach(gameId => {
    if (picks[gameId]) {
      result[gameId] = picks[gameId];
    }
  });

  return result;
}

function headToHeadWinner(group, teamA, teamB) {
  const groupGames = getGroupGames(group);
  const picks = state.currentEntry.picks.groupGames || {};

  for (const game of groupGames) {
    const isMatchup =
      (game.team1 === teamA && game.team2 === teamB) ||
      (game.team1 === teamB && game.team2 === teamA);

    if (!isMatchup) continue;

    const winner = picks[game.id];
    if (!winner) return null;

    if (winner === teamA) return teamA;
    if (winner === teamB) return teamB;
  }

  return null;
}

function calculateStandings(group) {
  const standings = {};

  groups[group].forEach(team => {
    standings[team] = {
      team,
      wins: 0,
      losses: 0
    };
  });

  const groupGames = getGroupGames(group);
  const picks = state.currentEntry.picks.groupGames || {};

  groupGames.forEach(game => {
    const winner = picks[game.id];
    if (!winner) return;

    const { team1, team2 } = game;

    if (winner === team1) {
      standings[team1].wins += 1;
      standings[team2].losses += 1;
    } else if (winner === team2) {
      standings[team2].wins += 1;
      standings[team1].losses += 1;
    }
  });

  return Object.values(standings).sort((a, b) => {
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }

    const h2h = headToHeadWinner(group, a.team, b.team);

    if (h2h === a.team) return -1;
    if (h2h === b.team) return 1;

    return a.team.localeCompare(b.team);
  });
}

function renderStandings(group) {
  const tbody = document.getElementById(`table-${group}`);
  if (!tbody) return;

  const standings = calculateStandings(group);

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

function renderAllStandings() {
  Object.keys(groups).forEach(group => {
    renderStandings(group);
  });
}