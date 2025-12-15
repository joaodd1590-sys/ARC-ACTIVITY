// ARC Testnet USDC contract
const USDC_CONTRACT = "0x3600000000000000000000000000000000000000";

const addrInput     = document.getElementById("addr");
const checkBtn      = document.getElementById("check");
const terminal      = document.getElementById("terminal");
const resultsContainer = document.getElementById("resultsContainer");

const snapWalletEl  = document.getElementById("snapWallet");
const snapTxEl      = document.getElementById("snapTx");
const snapActiveEl  = document.getElementById("snapActive");

const copyLinkBtn   = document.getElementById("copyLink");
const openExpBtn    = document.getElementById("openExplorer");

function shortAddr(a) {
  return a.slice(0, 6) + "..." + a.slice(-4);
}

function formatTime(ts) {
  return new Date(ts * 1000).toLocaleString("pt-BR");
}

function formatUSDC(raw) {
  return (Number(raw) / 1e6).toFixed(6);
}

function clearTerminal() {
  terminal.innerHTML = "";
}

function copyTxHash(btn, hash) {
  navigator.clipboard.writeText(hash);

  btn.classList.add("btn-copied", "btn-copy-anim");
  btn.textContent = "Copied!";

  setTimeout(() => {
    btn.classList.remove("btn-copied", "btn-copy-anim");
    btn.textContent = "Copy";
  }, 1000);
}

function appendTx(tx, wallet) {
  const isOut = tx.from.toLowerCase() === wallet.toLowerCase();
  const badge = isOut
    ? `<span class="badge-out">OUT</span>`
    : `<span class="badge-in">IN</span>`;

  const value = formatUSDC(tx.value);
  const link = `https://testnet.arcscan.app/tx/${tx.hash}`;

  const row = document.createElement("div");
  row.className = "tx";

  row.innerHTML = `
    <div class="tx-top">
      <div class="addresses">
        <div>
          <div class="addr-label">From</div>
          <div class="addr-value">${tx.from}</div>
        </div>
        <div>
          <div class="addr-label">To</div>
          <div class="addr-value">${tx.to}</div>
        </div>
      </div>

      <div>${badge}</div>
    </div>

    <div class="tx-bottom">
      <div class="tx-meta">${value} USDC • ${formatTime(tx.timeStamp)}</div>

      <div class="tx-actions">
        <button class="btn-secondary copy-btn"
          onclick="copyTxHash(this, '${tx.hash}')">Copy</button>
        <button class="btn-secondary"
          onclick="window.open('${link}', '_blank')">Explorer</button>
      </div>
    </div>
  `;

  terminal.prepend(row);
}

async function runScan() {
  const wallet = addrInput.value.trim();

  if (!wallet.startsWith("0x") || wallet.length < 42) {
    alert("Endereço inválido.");
    return;
  }

  resultsContainer.classList.add("hidden");
  terminal.innerHTML = "<div style='color:#aaa;'>Carregando...</div>";

  snapWalletEl.textContent = shortAddr(wallet);
  snapTxEl.textContent = "0";
  snapActiveEl.innerHTML = `<span class="active-no">No</span>`;

  try {
    const url =
      `https://testnet.arcscan.app/api?module=account&action=tokentx` +
      `&contractaddress=${USDC_CONTRACT}&address=${wallet}`;

    const res = await fetch(url);
    const data = await res.json();
    const txs = data.result || [];

    clearTerminal();

    txs.sort((a, b) => Number(a.timeStamp) - Number(b.timeStamp));

    snapTxEl.textContent = txs.length;
    snapActiveEl.innerHTML = txs.length
      ? `<span class="active-yes">Yes</span>`
      : `<span class="active-no">No</span>`;

    if (!txs.length) {
      terminal.innerHTML =
        "<div style='color:#aaa;'>Nenhuma transação USDC encontrada.</div>";
      resultsContainer.classList.remove("hidden");
      return;
    }

    txs.forEach(tx => appendTx(tx, wallet));

    resultsContainer.classList.remove("hidden");

  } catch (err) {
    terminal.innerHTML =
      "<div style='color:#aaa;'>Erro ao conectar à API.</div>";
  }
}

checkBtn.onclick = runScan;

addrInput.addEventListener("keyup", e => {
  if (e.key === "Enter") runScan();
});

copyLinkBtn.onclick = () => {
  const wallet = addrInput.value.trim();
  navigator.clipboard.writeText(
    `${location.origin}${location.pathname}?addr=${wallet}`
  );
  alert("Copiado!");
};

openExpBtn.onclick = () => {
  const wallet = addrInput.value.trim();
  window.open(`https://testnet.arcscan.app/address/${wallet}`, "_blank");
};


