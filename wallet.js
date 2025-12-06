const scanBtn = document.getElementById("scanBtn");
const walletInput = document.getElementById("walletInput");

scanBtn.onclick = async () => {
    const address = walletInput.value.trim();
    if (!address) return alert("Enter a wallet address.");

    const res = await fetch(`/api/activity?address=${address}`);
    const data = await res.json();

    document.getElementById("snapAddress").textContent = address;
    document.getElementById("snapTxCount").textContent = data.total;
    document.getElementById("activityStatus").textContent = data.total > 0 ? "ACTIVE" : "NONE";
    document.getElementById("snapActive").textContent = data.total > 0 ? "Yes" : "No";
    document.getElementById("snapActive").className = data.total > 0 ? "badge-yes" : "badge-no";

    document.getElementById("firstTx").textContent = data.firstTx;
    document.getElementById("lastTx").textContent = data.lastTx;

    const txList = document.getElementById("txList");
    txList.innerHTML = "";

    data.transactions.forEach(tx => {
        txList.innerHTML += `
            <div class="tx-item">
                <div style="color:#ff4dff">${tx.hash.slice(0,14)}...</div>
                <div>From: ${tx.from}</div>
                <div>To: ${tx.to}</div>
                <div>Value: ${tx.value}</div>
                <div>Time: ${tx.time}</div>

                <button onclick="copy('${tx.hash}')">Copy</button>
                <button onclick="openTx('${tx.hash}')">Explorer</button>
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
