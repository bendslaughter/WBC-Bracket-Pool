const scoringRules = {
  groupGame: 1,
  quarterfinal: 2,
  semifinal: 4,
  final: 6
};

function scoreEntry(entry, officialResults = state.officialResults) {
  let total = 0;

  let breakdown = {
    group: 0,
    quarterfinal: 0,
    semifinal: 0,
    final: 0
  };

  let correctPicks = 0;
  let pendingPicks = 0;

  const entryGroupPicks = entry.picks?.groupGames || {};
  const officialGroupResults = officialResults.groupGames || {};

  Object.keys(entryGroupPicks).forEach(gameId => {
    const userPick = entryGroupPicks[gameId];
    const officialPick = officialGroupResults[gameId];

    if (!officialPick) {
      pendingPicks++;
      return;
    }

    if (userPick === officialPick) {
      total += scoringRules.groupGame;
      breakdown.group += scoringRules.groupGame;
      correctPicks++;
    }
  });

  const entryKnockoutPicks = entry.picks?.knockoutGames || {};
  const officialKnockoutResults = officialResults.knockoutGames || {};

  Object.keys(entryKnockoutPicks).forEach(matchId => {
    const userPick = entryKnockoutPicks[matchId];
    const officialPick = officialKnockoutResults[matchId];

    if (!officialPick) {
      pendingPicks++;
      return;
    }

    if (userPick !== officialPick) return;

    if (matchId.startsWith("qf")) {
      total += scoringRules.quarterfinal;
      breakdown.quarterfinal += scoringRules.quarterfinal;
    } else if (matchId.startsWith("sf")) {
      total += scoringRules.semifinal;
      breakdown.semifinal += scoringRules.semifinal;
    } else if (matchId === "final") {
      total += scoringRules.final;
      breakdown.final += scoringRules.final;
    }

    correctPicks++;
  });

  return {
    name: entry.name || "",
    total,
    correctPicks,
    pendingPicks,
    breakdown
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

function getLeaderboard(entries = state.entries, officialResults = state.officialResults) {
  const scoredEntries = scoreAllEntries(entries, officialResults);

  return scoredEntries
    .sort((a, b) => {
      if (b.score.total !== a.score.total) {
        return b.score.total - a.score.total;
      }

      return new Date(a.submittedAt) - new Date(b.submittedAt);
    })
    .map((entry, index) => {
      return {
        rank: index + 1,
        name: entry.name,
        total: entry.score.total,
        correctPicks: entry.score.correctPicks,
        pendingPicks: entry.score.pendingPicks,
        breakdown: entry.score.breakdown,
        submittedAt: entry.submittedAt
      };
    });
}