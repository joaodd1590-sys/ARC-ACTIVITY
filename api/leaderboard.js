async function loadLeaderboard() {
    const box = document.getElementById("leaderboard");
    box.textContent = "Loading…";

    const res = await fetch("/api/leaderboard");
    const data = await res.json();

    box.innerHTML = "";
    data.forEach((row, i) => {
        box.innerHTML += `<div>#${i+1} — ${row.wallet} (${row.total} tx)</div>`;
    });
}

document.getElementById("refreshLB").onclick = loadLeaderboard;
loadLeaderboard();
