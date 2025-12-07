// ===============================
// ARC ACTIVITY TRACKER - FRONTEND
// ===============================

const addrInput     = document.getElementById("addr");
const checkBtn      = document.getElementById("check");
const terminal      = document.getElementById("terminal");
const summary       = document.getElementById("summary");
const tcountEl      = document.getElementById("tcount");
const firstEl       = document.getElementById("first");
const lastEl        = document.getElementById("last");
const statusEl      = document.getElementById("status");
const snapWalletEl  = document.getElementById("snapWallet");
const snapTxEl      = document.getElementById("snapTx");
const snapActiveEl  = document.getElementById("snapActive");
const copyLinkBtn   = document.getElementById("copyLink");
const openExpBtn    = document.getElementById("openExplorer");

function clearTerminal() {
  terminal.innerHTML = "";
}

function shortAddr(addr) {
  if (!addr || addr.length < 10) return addr || "--";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function appendTx(tx, wallet) {
  const row = document.createElement("div");
  row.className = "tx";

  const wLower = wallet.toLowerCase();
  const fromLower = (tx.from || "").toLowerCase();
  const toLower   = (tx.to || "").toLowerCase();

  let direction = "";
  if (fromLower === wLower) direction = "OUT";
  else if (toLower === wLower) direction = "IN";

  const badge =
    direction === "IN"
      ? `<span class="badge-in">IN</span>`
      : direction === "OUT"
      ? `<span class="badge-out">OUT</span>`
      : "";

  const fromText = tx.from || "--";
  const toText   = tx.to   || "--";

  const totalText = tx.total || tx.value || "0 ARC";

  row.innerHTML = `
    <div class="left">
      <div class="hash">${tx.hash}</div>
      <div class="meta">
        ${fromText} → ${toText}
        • Total: ${totalText}
        • ${tx.time}
      </div>
    </div>
    <div class="actions">
      ${badge}
      <button class="btn-ghost" onclick="navigator.clipboard.writeText('${tx.hash}')">Copy</button>
      <button class="btn-ghost" onclick="window.open('${tx.link}','_blank')">Explorer</button>
    </div>
  `;

  terminal.prepend(row);
}

async function runScan() {
  const wallet = addrInput.value.trim();

  if (!wallet || !wallet.startsWith("0x") || wallet.length < 40) {
    alert("Paste a valid Arc Testnet wallet (0x...)");
    return;
  }

  terminal.innerHTML = `<div style="padding:10px; color:var(--muted);">Scanning Arc Testnet...</div>`;
  summary.style.display = "none";

  snapWalletEl.textContent = shortAddr(wallet);
  snapTxEl.textContent = "0";
  snapActiveEl.innerHTML = `<span class="badge-out">No</span>`;

  try {
    const resp = await fetch(`/api/activity?address=${encodeURIComponent(wallet)}`);
    if (!resp.ok) {
      terminal.innerHTML = `<div style="padding:10px; color:var(--muted);">Server error ${resp.status}</div>`;
      return;
    }

    const data = await resp.json();
    const txs = data.transactions || [];
    const total = txs.length;

    tcountEl.textContent = total.toString();
    snapTxEl.textContent = total.toString();

    if (total > 0) {
      const newest = txs[0];
      const oldest = txs[txs.length - 1];

      firstEl.textContent  = oldest.time || "--";
      lastEl.textContent   = newest.time || "--";
      statusEl.textContent = "ACTIVE";
      statusEl.style.color = "#00ff9c";
      snapActiveEl.innerHTML = `<span class="badge-in">Yes</span>`;
    } else {
      firstEl.textContent  = "--";
      lastEl.textContent   = "--";
      statusEl.textContent = "NO ACTIVITY";
      statusEl.style.color = "#ff6b6b";
      snapActiveEl.innerHTML = `<span class="badge-out">No</span>`;
    }

    summary.style.display = "flex";

    clearTerminal();

    if (!txs.length) {
      terminal.innerHTML = `<div style="padding:10px; color:var(--muted);">No transactions found for this wallet.</div>`;
      return;
    }

    txs.forEach(tx => appendTx(tx, wallet));

  } catch (err) {
    terminal.innerHTML = `<div style="padding:10px; color:var(--muted);">Network error while contacting backend.</div>`;
  }
}

copyLinkBtn?.addEventListener("click", () => {
  const wallet = addrInput.value.trim();
  if (!wallet) return;
  const url = `${location.origin}/?addr=${encodeURIComponent(wallet)}`;
  navigator.clipboard.writeText(url);
  alert("Profile link copied");
});

openExpBtn?.addEventListener("click", () => {
  const wallet = addrInput.value.trim();
  if (!wallet) return;
  window.open(`https://testnet.arcscan.app/address/${wallet}`, "_blank");
});

checkBtn.addEventListener("click", runScan);

addrInput.addEventListener("keydown", e => {
  if (e.key === "Enter") runScan();
});

(function autoloadFromQuery() {
  const params = new URLSearchParams(location.search);
  const a = params.get("addr");
  if (a && a.startsWith("0x") && a.length > 40) {
    addrInput.value = a;
    runScan();
  }
})();
