// Simple ARC wallet activity checker

const addrInput     = document.getElementById("addr");
const checkBtn      = document.getElementById("check");
const terminal      = document.getElementById("terminal");
const snapWalletEl  = document.getElementById("snapWallet");
const snapTxEl      = document.getElementById("snapTx");
const snapActiveEl  = document.getElementById("snapActive");
const copyLinkBtn   = document.getElementById("copyLink");
const openExpBtn    = document.getElementById("openExplorer");

// clear terminal output
function clearTerminal() {
  terminal.innerHTML = "";
}

// shorten address for UI
function shortAddr(addr) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

// render one transaction row
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

  // newest on top
  terminal.prepend(row);
}

// main scan function
async function runScan() {
  const wallet = addrInput.value.trim();

  if (!wallet.startsWith("0x") || wallet.length < 40) {
    alert("Paste a valid Arc Testnet wallet.");
    return;
  }

  terminal.innerHTML =
    "<div style='color:#aaa;padding:10px;'>Scanning...</div>";

  snapWalletEl.textContent = shortAddr(wallet);
  snapTxEl.textContent = "0";
  snapActiveEl.innerHTML = `<span class="badge-out">No</span>`;

  try {
    const res = await fetch(
      `/api/activity?address=${encodeURIComponent(wallet)}`
    );
    const data = await res.json();
    const txs = data.transactions || [];

    snapTxEl.textContent = txs.length;
    snapActiveEl.innerHTML = txs.length
      ? `<span class="badge-in">Yes</span>`
      : `<span class="badge-out">No</span>`;

    clearTerminal();

    if (!txs.length) {
      terminal.innerHTML =
        "<div style='color:#aaa;padding:10px;'>No transactions found.</div>";
      return;
    }

    txs.forEach((tx) => appendTx(tx, wallet));
  } catch (err) {
    console.error(err);
    terminal.innerHTML =
      "<div style='color:#aaa;padding:10px;'>Network error.</div>";
  }
}

// button + Enter key
checkBtn.onclick = runScan;
addrInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") runScan();
});

// shareable link with current address
copyLinkBtn.onclick = () => {
  const wallet = addrInput.value.trim();
  const url = `${location.origin}${location.pathname}?addr=${encodeURIComponent(
    wallet
  )}`;
  navigator.clipboard.writeText(url);
  alert("Copied!");
};

// open explorer for current address
openExpBtn.onclick = () => {
  const wallet = addrInput.value.trim();
  if (!wallet) return;
  window.open(
    `https://testnet.arcscan.app/address/${encodeURIComponent(wallet)}`,
    "_blank"
  );
};
