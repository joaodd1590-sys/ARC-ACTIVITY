const scanBtn = document.getElementById("scanBtn");
const walletInput = document.getElementById("walletInput");

scanBtn.onclick = async () => {
    const address = walletInput.value.trim();
    if (!address) return alert("Enter a wallet address.");

    const res = await fetch(`/api/activity?address=${address}`);
    const data = await res.json();

    // SNAPSHOT
    document.getElementById("snapAddress").textContent = address;
    document.getElementById("snapTxCount").textContent = data.total;
    document.getElementById("snapActive").textContent = data.total > 0 ? "Yes" : "No";
    document.getElementById("snapActive").className = data.total > 0 ? "badge-yes" : "badge-no";

    // STATS TOP BAR
    document.getElementById("totalTx").textContent = data.total;
    document.getElementById("firstTx").textContent = data.firstTx || "--";
    document.getElementById("lastTx").textContent = data.lastTx || "--";
    document.getElementById("activityStatus").textContent = data.total > 0 ? "ACTIVE" : "NONE";

    // TRANSACTIONS LIST
    const txList = document.getElementById("txList");
    txList.innerHTML = "";

    if (data.transactions.length === 0) {
        txList.innerHTML = "<p>No transactions found.</p>";
        return;
    }

    data.transactions.forEach(tx => {
        const badge = tx.direction === "IN"
            ? `<span class="badge-in">IN</span>`
            : `<span class="badge-out">OUT</span>`;

        txList.innerHTML += `
            <div class="tx-item">
                <div class="tx-hash">${tx.hash.slice(0, 14)}...</div>
                ${badge}
                <div>From: ${tx.from}</div>
                <div>To: ${tx.to}</div>
                <div>Value: ${tx.value}</div>
                <div>Time: ${tx.time}</div>
                <button class="btn-small" onclick="copy('${tx.hash}')">Copy</button>
                <button class="btn-small-alt" onclick="openTx('${tx.hash}')">Explorer</button>
            </div>
        `;
    });
};

function copy(text) {
    navigator.clipboard.writeText(text);
    alert("Copied!");
}

function openTx(hash) {
    window.open(`https://testnet.arcscan.app/tx/${hash}`);
}

document.getElementById("copyProfile").onclick = () => {
    navigator.clipboard.writeText(
        `https://testnet.arcscan.app/address/${walletInput.value.trim()}`
    );
};

document.getElementById("openArcScan").onclick = () => {
    window.open(`https://testnet.arcscan.app/address/${walletInput.value.trim()}`);
};
