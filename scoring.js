const scoringRules = {
  groupGame: 1,
  quarterfinal: 2,
  semifinal: 4,
  final: 6
};

function scoreEntry(entry, officialResults) {

  let total = 0;
  let maxPossible = 0;

  const entryGroup = entry.picks.groupGames || {};
  const officialGroup = officialResults.groupGames || {};

  Object.keys(entryGroup).forEach(gameId => {

    const pick = entryGroup[gameId];
    const result = officialGroup[gameId];

    if (!result) {
      maxPossible += scoringRules.groupGame;
      return;
    }

    if (pick === result) {
      total += scoringRules.groupGame;
      maxPossible += scoringRules.groupGame;
    }

  });

  const entryKO = entry.picks.knockoutGames || {};
  const officialKO = officialResults.knockoutGames || {};

  Object.keys(entryKO).forEach(matchId => {

    const pick = entryKO[matchId];
    const result = officialKO[matchId];

    let points = 0;

    if (matchId.startsWith("qf")) points = scoringRules.quarterfinal;
    if (matchId.startsWith("sf")) points = scoringRules.semifinal;
    if (matchId === "final") points = scoringRules.final;

    if (!result) {
      maxPossible += points;
      return;
    }

    if (pick === result) {
      total += points;
      maxPossible += points;
    }

  });

  return {
    name: entry.name,
    total,
    maxPossible
  };
}

function scoreAllEntries(entries = state.entries, officialResults = state.officialResults) {
  return entries.map(entry => {
    return {
      ...entry,
      score: scoreEntry(entry, officialResults)
    };
  });
}

function getLeaderboard(entries, officialResults) {
  const scored = entries.map(entry => {
    const score = scoreEntry(entry, officialResults);

    return {
      id: entry.id,
      name: entry.name,
      total: score.total,
      maxPossible: score.maxPossible,
      submittedAt: entry.submittedAt
    };
  });

  scored.sort((a, b) => {
    if (b.total !== a.total) {
      return b.total - a.total;
    }

    return new Date(a.submittedAt) - new Date(b.submittedAt);
  });

  return scored.map((row, i) => ({
    rank: i + 1,
    ...row
  }));
}