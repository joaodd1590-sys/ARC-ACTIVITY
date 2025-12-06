async function loadLeaderboard() {
    const box = document.getElementById("leaderboard");
    box.innerHTML = "Loading…";

    const res = await fetch("/api/leaderboard");
    const data = await res.json();

    box.innerHTML = "";

    if (data.length === 0) {
        box.innerHTML = "<p>No leaderboard data yet.</p>";
        return;
    }

    data.forEach((row, i) => {
        box.innerHTML += `
            <div class="lb-item">
                <span>#${i+1}</span>
                <span>${row.wallet}</span>
                <span>${row.total} tx</span>
            </div>
        `;
    });
}

document.getElementById("refreshLB").onclick = loadLeaderboard;
loadLeaderboard();
