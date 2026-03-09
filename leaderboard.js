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

async function fetchOfficialResults() {
  const { data, error } = await supabaseClient
    .from("official_results")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    console.error("Error loading official results:", error);
    return {
      groupGames: {},
      knockoutGames: {}
    };
  }

  return {
    groupGames: data.group_results || {},
    knockoutGames: data.knockout_results || {}
  };
}

function renderLeaderboard(rows) {
  const tbody = document.getElementById("leaderboard-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  rows.forEach(row => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${row.rank}</td>
      <td>
        <a class="entry-link" href="bracket.html?id=${row.id}">
          ${row.name}
        </a>
      </td>
      <td>${row.total}</td>
      <td>${row.maxPossible}</td>
    `;

    tbody.appendChild(tr);
  });
}

async function loadLeaderboard() {
  const entries = await fetchEntries();
  const officialResults = await fetchOfficialResults();

  const formattedEntries = entries.map(entry => ({
    id: entry.id,
    name: entry.name,
    submittedAt: entry.submitted_at,
    picks: {
      groupGames: entry.group_picks || {},
      knockoutGames: entry.knockout_picks || {}
    }
  }));

  const leaderboard = getLeaderboard(formattedEntries, officialResults);
  console.log("leaderboard:", leaderboard);
  renderLeaderboard(leaderboard);
}

loadLeaderboard();