const addrInput = document.getElementById("addr");
const checkBtn = document.getElementById("check");
const terminal = document.getElementById("terminal");
const snapWalletEl = document.getElementById("snapWallet");
const snapTxEl = document.getElementById("snapTx");
const snapActiveEl = document.getElementById("snapActive");
const copyLinkBtn = document.getElementById("copyLink");
const openExpBtn = document.getElementById("openExplorer");

function clearTerminal() {
    terminal.innerHTML = "";
}

function shortAddr(addr) {
    return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function appendTx(tx, wallet) {
    const row = document.createElement("div");
    row.className = "tx";

    const isOut = tx.from?.toLowerCase() === wallet.toLowerCase();
    const badge = isOut
        ? `<span class="badge-out">OUT</span>`
        : `<span class="badge-in">IN</span>`;

    row.innerHTML = `
        <div>
            <div class="hash">${tx.hash}</div>
            <div class="meta">${tx.from} → ${tx.to} • ${tx.value} • ${tx.time}</div>
        </div>
        <div class="actions">
            ${badge}
            <button class="btn-secondary" onclick="navigator.clipboard.writeText('${tx.hash}')">Copy</button>
            <button class="btn-secondary" onclick="window.open('${tx.link}', '_blank')">Explorer</button>
        </div>
    `;

    terminal.prepend(row);
}

async function runScan() {
    const wallet = addrInput.value.trim();

    if (!wallet.startsWith("0x") || wallet.length < 40) {
        alert("Paste a valid Arc Testnet wallet.");
        return;
    }

    terminal.innerHTML = "<div style='color:#aaa;padding:10px;'>Scanning...</div>";

    snapWalletEl.textContent = shortAddr(wallet);
    snapTxEl.textContent = "0";
    snapActiveEl.innerHTML = `<span class="badge-out">No</span>`;

    try {
        const res = await fetch(`/api/activity?address=${wallet}`);
        const data = await res.json();
        const txs = data.transactions || [];

        snapTxEl.textContent = txs.length;
        snapActiveEl.innerHTML = txs.length
            ? `<span class="badge-in">Yes</span>`
            : `<span class="badge-out">No</span>`;

        clearTerminal();

        if (!txs.length) {
            terminal.innerHTML = "<div style='color:#aaa;padding:10px;'>No transactions found.</div>";
            return;
        }

        txs.forEach(tx => appendTx(tx, wallet));

    } catch (err) {
        terminal.innerHTML = "<div style='color:#aaa;padding:10px;'>Network error.</div>";
    }
}

checkBtn.onclick = runScan;

copyLinkBtn.onclick = () => {
    const url = `${location.origin}/?addr=${addrInput.value}`;
    navigator.clipboard.writeText(url);
    alert("Copied!");
};

openExpBtn.onclick = () => {
    window.open(`https://testnet.arcscan.app/address/${addrInput.value}`, "_blank");
};
