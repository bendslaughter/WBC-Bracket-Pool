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

let currentUser = null;

function updateAuthUI(user) {
  currentUser = user;

  const openBtn = document.getElementById("open-auth-modal");
  const signOutBtn = document.getElementById("sign-out-btn");
  const headerStatus = document.getElementById("header-auth-status");
  const authStatus = document.getElementById("auth-status");
  const emailInput = document.getElementById("auth-email");
  const emailBtn = document.getElementById("send-magic-link");
  const googleBtn = document.getElementById("sign-in-google");


  if (user) {
    if (openBtn) openBtn.classList.add("hidden");
    if (signOutBtn) signOutBtn.classList.remove("hidden");
    if (headerStatus) headerStatus.innerText = user.email || "";

    if (authStatus) authStatus.innerText = "";
    if (emailInput) emailInput.value = "";

    closeAuthModal();
  } else {
    if (openBtn) openBtn.classList.remove("hidden");
    if (signOutBtn) signOutBtn.classList.add("hidden");
    if (headerStatus) headerStatus.innerText = "";

    if (emailInput) emailInput.classList.remove("hidden");
    if (emailBtn) emailBtn.classList.remove("hidden");
    if (googleBtn) googleBtn.classList.remove("hidden");
  }
  const adminLink = document.getElementById("admin-link");

if (adminLink) {
  if (user && user.email === "benjamindslaughter@gmail.com") {
    adminLink.classList.remove("hidden");
  } else {
    adminLink.classList.add("hidden");
  }
}
}

function setupAuthButtons() {
  const emailBtn = document.getElementById("send-magic-link");
  const googleBtn = document.getElementById("sign-in-google");
  const signOutBtn = document.getElementById("sign-out-btn");
  const emailInput = document.getElementById("auth-email");
  const authStatus = document.getElementById("auth-status");

  if (emailBtn && emailInput) {
    emailBtn.addEventListener("click", async () => {
      const email = emailInput.value.trim();

      if (!email) {
        if (authStatus) authStatus.innerText = "Please enter your email";
        return;
      }

      const { error } = await sendMagicLink(email);

      if (error) {
        console.error(error);
        if (authStatus) authStatus.innerText = "Could not send login link";
        return;
      }

      if (authStatus) authStatus.innerText = "Check your email for a login link";
    });
  }

  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      const { error } = await signInWithProvider("google");

      if (error) {
        console.error(error);
        if (authStatus) authStatus.innerText = "Google sign-in failed";
      }
    });
  }


if (signOutBtn) {
  signOutBtn.addEventListener("click", async () => {
    await signOutUser();
    updateAuthUI(null);
    window.location.reload();
  });
}
}

function setupSubmitButton() {
  const btn = document.getElementById("submit-entry");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (!currentUser) {
      alert("Please sign in before submitting your bracket.");
      return;
    }

    if (!state.currentEntry.name.trim()) {
      alert("Please enter your name before submitting.");
      return;
    }

    btn.disabled = true;

    const entry = {
      name: state.currentEntry.name.trim(),
      user_id: currentUser.id,
      group_picks: state.currentEntry.picks.groupGames,
      knockout_picks: state.currentEntry.picks.knockoutGames
    };

    const { error } = await supabaseClient
      .from("entries")
      .insert([entry]);

    btn.disabled = false;

    if (error) {
      console.error("Supabase insert error:", error);
      alert("There was a problem submitting your bracket.");
      return;
    }

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

async function fetchEntries() {
  const { data, error } = await supabaseClient
    .from("entries")
    .select("*")
    .order("submitted_at", { ascending: true });

  if (error) {
    console.error("Error loading entries:", error);
    return [];
  }

  return data;
}

async function init() {
  loadState();

  const user = await getCurrentUser();
  updateAuthUI(user);
  listenForAuthChanges(updateAuthUI);

  setupAuthModalControls();
  setupAuthButtons();

  setupEntryName();
  setupSubmitButton();

  buildGames();
  renderAllStandings();
  updateBracket();
}

init();