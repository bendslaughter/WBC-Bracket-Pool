function getTopTeams() {
  const result = {};

  Object.keys(groups).forEach(group => {
    const standings = calculateStandings(group);

    result[group] = {
      first: standings[0]?.team || null,
      second: standings[1]?.team || null
    };
  });

  return result;
}

function getKnockoutTeams() {
  const top = getTopTeams();
  const picks = state.currentEntry.picks.knockoutGames;

  return {
    qf1: [top.A?.first || "A1", top.B?.second || "B2"],
    qf2: [top.B?.first || "B1", top.A?.second || "A2"],
    qf3: [top.C?.first || "C1", top.D?.second || "D2"],
    qf4: [top.D?.first || "D1", top.C?.second || "C2"],

    sf1: [picks.qf1 || "QF1 Winner", picks.qf2 || "QF2 Winner"],
    sf2: [picks.qf3 || "QF3 Winner", picks.qf4 || "QF4 Winner"],

    final: [picks.sf1 || "SF1 Winner", picks.sf2 || "SF2 Winner"]
  };
}

function renderMatch(matchId, team1, team2) {
  const container = document.getElementById(matchId);
  if (!container) return;

  const isPlaceholder1 =
    team1 === "QF1 Winner" ||
    team1 === "QF2 Winner" ||
    team1 === "QF3 Winner" ||
    team1 === "QF4 Winner" ||
    team1 === "SF1 Winner" ||
    team1 === "SF2 Winner" ||
    team1 === "A1" ||
    team1 === "A2" ||
    team1 === "B1" ||
    team1 === "B2" ||
    team1 === "C1" ||
    team1 === "C2" ||
    team1 === "D1" ||
    team1 === "D2";

  const isPlaceholder2 =
    team2 === "QF1 Winner" ||
    team2 === "QF2 Winner" ||
    team2 === "QF3 Winner" ||
    team2 === "QF4 Winner" ||
    team2 === "SF1 Winner" ||
    team2 === "SF2 Winner" ||
    team2 === "A1" ||
    team2 === "A2" ||
    team2 === "B1" ||
    team2 === "B2" ||
    team2 === "C1" ||
    team2 === "C2" ||
    team2 === "D1" ||
    team2 === "D2";

  const selectedWinner = state.currentEntry.picks.knockoutGames[matchId];

  container.innerHTML = `
    <button
      class="team-btn ${selectedWinner === team1 ? "selected" : ""}"
      data-team="${team1}"
      ${isPlaceholder1 ? "disabled" : ""}
    >
      ${team1}
    </button>

    <button
      class="team-btn ${selectedWinner === team2 ? "selected" : ""}"
      data-team="${team2}"
      ${isPlaceholder2 ? "disabled" : ""}
    >
      ${team2}
    </button>
  `;

  const buttons = container.querySelectorAll(".team-btn");

  buttons.forEach(btn => {
    if (btn.disabled) return;

    btn.addEventListener("click", () => {
      const winner = btn.dataset.team;
      const currentWinner = state.currentEntry.picks.knockoutGames[matchId];

      if (currentWinner === winner) {
        delete state.currentEntry.picks.knockoutGames[matchId];
      } else {
        state.currentEntry.picks.knockoutGames[matchId] = winner;
      }

      clearDependentPicks(matchId);
      saveState();
      updateBracket();
    });
  });
}

function clearDependentPicks(matchId) {
  if (matchId === "qf1" || matchId === "qf2") {
    delete state.currentEntry.picks.knockoutGames.sf1;
    delete state.currentEntry.picks.knockoutGames.final;
  }

  if (matchId === "qf3" || matchId === "qf4") {
    delete state.currentEntry.picks.knockoutGames.sf2;
    delete state.currentEntry.picks.knockoutGames.final;
  }

  if (matchId === "sf1" || matchId === "sf2") {
    delete state.currentEntry.picks.knockoutGames.final;
  }
}

function updateChampion() {
  const champion = state.currentEntry.picks.knockoutGames.final || "Champion";
  const championEl = document.getElementById("champion");

  if (championEl) {
    championEl.innerText = champion;
  }
}

function updateBracket() {
  const knockoutTeams = getKnockoutTeams();

  renderMatch("qf1", knockoutTeams.qf1[0], knockoutTeams.qf1[1]);
  renderMatch("qf2", knockoutTeams.qf2[0], knockoutTeams.qf2[1]);
  renderMatch("qf3", knockoutTeams.qf3[0], knockoutTeams.qf3[1]);
  renderMatch("qf4", knockoutTeams.qf4[0], knockoutTeams.qf4[1]);

  renderMatch("sf1", knockoutTeams.sf1[0], knockoutTeams.sf1[1]);
  renderMatch("sf2", knockoutTeams.sf2[0], knockoutTeams.sf2[1]);

  renderMatch("final", knockoutTeams.final[0], knockoutTeams.final[1]);

  updateChampion();
}