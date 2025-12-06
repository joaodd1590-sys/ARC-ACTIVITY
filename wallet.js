// ===========================================
// ARC ACTIVITY TRACKER — FRONTEND FINAL VERSION
// ===========================================

// Selectors
const addrInput = document.getElementById("addr");
const checkBtn = document.getElementById("check");
const terminal = document.getElementById("terminal");

const summary = document.getElementById("summary");
const tcount = document.getElementById("tcount");
const firstTx = document.getElementById("first");
const lastTx = document.getElementById("last");
const statusEl = document.getElementById("status");

const snapWallet = document.getElementById("snapWallet");
const snapTx = document.getElementById("snapTx");
const snapActive = document.getElementById("snapActive");

const copyLinkBtn = document.getElementById("copyLink");
const openExplorerBtn = document.getElementById("openExplorer");

// ===========================================
// FORMAT VALUE (Fix NaN issue) — USDC on ARC uses 6 decimals
// ===========================================
function formatValue(rawValue) {
    if (!rawValue) return "0.0000";

    let n = Number(rawValue);

    // if backend returns hex string like "0x12af..."
    if (typeof rawValue === "string" && rawValue.startsWith("0x")) {
        n = parseInt(rawValue, 16);
    }

    if (isNaN(n)) return "0.0000";

    return (n / 1e6).toFixed(4);
}

// ===========================================
// TERMINAL HELPERS
// ===========================================
function clearTerminal() {
    terminal.innerHTML = "";
}

function appendTx(tx, wallet) {
    const isOut = tx.from?.toLowerCase() === wallet.toLowerCase();
    const badge = isOut
        ? `<span class="badge-out">OUT</span>`
        : `<span class="badge-in">IN</span>`;

    const div = document.createElement("div");
    div.className = "tx";

    div.innerHTML = `
        <div class="left">
            <div class="hash">${tx.hash}</div>
            <div class="meta">
                ${tx.from} → ${tx.to} • ${formatValue(tx.value)} USDC • ${tx.time}
            </div>
        </div>

        <div class="actions">
            ${badge}
            <button class="btn-ghost" onclick="navigator.clipboard.writeText('${tx.hash}')">Copy</button>
            <button class="btn-ghost" onclick="window.open('${tx.link}', '_blank')">Explorer</button>
        </div>
    `;

    terminal.appendChild(div);
}

// ===========================================
// MAIN SCAN FUNCTION
// ===========================================
async function runScan() {
    const wallet = addrInput.value.trim();

    if (!wallet.startsWith("0x") || wallet.length < 20) {
        alert("Enter a valid Arc wallet address.");
        return;
    }

    terminal.innerHTML = `<span style="color:var(--muted)">Scanning...</span>`;
    summary.style.display = "none";

    try {
        const res = await fetch(`/api/activity?address=${wallet}`);
        const data = await res.json();

        const txs = data.transactions || [];

        snapWallet.textContent = wallet;
        snapTx.textContent = txs.length;
        snapActive.innerHTML = txs.length
            ? `<span class="badge-in">Yes</span>`
            : `<span class="badge-out">No</span>`;

        tcount.textContent = txs.length;

        firstTx.textContent = txs.length ? txs[txs.length - 1].time : "--";
        lastTx.textContent = txs.length ? txs[0].time : "--";

        statusEl.textContent = txs.length ? "ACTIVE" : "NO ACTIVITY";
        statusEl.style.color = txs.length ? "#00ffa5" : "#ff6b6b";

        summary.style.display = "flex";

        clearTerminal();

        if (!txs.length) {
            terminal.innerHTML = `<span style="color:var(--muted)">No transactions found.</span>`;
            return;
        }

        txs.forEach(tx => appendTx(tx, wallet));

    } catch (err) {
        console.error(err);
        terminal.innerHTML = `<span style="color:var(--muted)">Network error.</span>`;
    }
}

// ===========================================
// EVENTS
// ===========================================
checkBtn.onclick = runScan;

addrInput.addEventListener("keydown", e => {
    if (e.key === "Enter") runScan();
});

copyLinkBtn.onclick = () => {
    const w = addrInput.value.trim();
    if (!w) return;

    navigator.clipboard.writeText(`${location.origin}/?addr=${w}`);
    alert("Link copied!");
};

openExplorerBtn.onclick = () => {
    const w = addrInput.value.trim();
    if (!w) return;

    window.open(`https://arcscan.net/address/${w}`, "_blank");
};

// ===========================================
// AUTOLOAD ?addr=
// ===========================================
(function () {
    const params = new URLSearchParams(location.search);
    const a = params.get("addr");

    if (a && a.startsWith("0x")) {
        addrInput.value = a;
        runScan();
    }
})();
