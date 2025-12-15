// ARC Testnet USDC contract (known token)
const USDC_CONTRACT = "0x3600000000000000000000000000000000000000";

const addrInput = document.getElementById("addr");
const checkBtn = document.getElementById("check");
const terminal = document.getElementById("terminal");
const resultsContainer = document.getElementById("resultsContainer");

const snapWalletEl = document.getElementById("snapWallet");
const snapTxEl = document.getElementById("snapTx");
const snapActiveEl = document.getElementById("snapActive");

const copyLinkBtn = document.getElementById("copyLink");
const openExpBtn = document.getElementById("openExplorer");

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
  btn.textContent = "Copied!";
  setTimeout(() => (btn.textContent = "Copy"), 1000);
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
        <div><div class="addr-label">From</div><div class="addr-value">${tx.from}</div></div>
        <div><div class="addr-label">To</div><div class="addr-value">${tx.to}</div></div>
      </div>
      <div>${badge}</div>
    </div>
    <div class="tx-bottom">
      <div class="tx-meta">${value} USDC • ${formatTime(tx.timeStamp)}</div>
      <div class="tx-actions">
        <button onclick="copyTxHash(this,'${tx.hash}')">Copy</button>
        <button onclick="window.open('${link}','_blank')">Explorer</button>
      </div>
    </div>
  `;

  terminal.prepend(row);
}

async function runScan() {
  const wallet = addrInput.value.trim().toLowerCase();

  // =========================
  // BASIC VALIDATION
  // =========================
  if (!wallet.startsWith("0x") || wallet.length !== 42) {
    alert("Endereço inválido.");
    return;
  }

  // =========================
  // BLOCK KNOWN TOKEN
  // =========================
  if (wallet === USDC_CONTRACT.toLowerCase()) {
    terminal.innerHTML =
      "<div style='color:#ff4d4d;font-weight:700;'>Este endereço é um contrato de token (USDC), não uma wallet.</div>";
    resultsContainer.classList.add("hidden");
    return;
  }

  terminal.innerHTML =
    "<div style='color:#aaa;'>Analisando endereço (heurística Testnet)…</div>";
  resultsContainer.classList.add("hidden");

  snapWalletEl.textContent = shortAddr(wallet);
  snapTxEl.textContent = "0";
  snapActiveEl.innerHTML = `<span class="active-no">No</span>`;

  let addressType = "unknown";

  try {
    // =========================
    // STEP 1 — NORMAL TX CHECK
    // =========================
    const txlistRes = await fetch(
      `https://testnet.arcscan.app/api?module=account&action=txlist&address=${wallet}&sort=desc`
    );
    const txlistData = await txlistRes.json();

    if (
      txlistData.status === "1" &&
      Array.isArray(txlistData.result) &&
      txlistData.result.length > 0
    ) {
      addressType = "wallet";
    }

    // =========================
    // STEP 2 — TOKEN HEURISTIC
    // =========================
    if (addressType === "unknown") {
      const tokenRes = await fetch(
        `https://testnet.arcscan.app/api?module=token&action=tokeninfo&contractaddress=${wallet}`
      );
      const tokenData = await tokenRes.json();

      if (
        tokenData.status === "1" &&
        tokenData.result &&
        tokenData.result.tokenName
      ) {
        terminal.innerHTML =
          "<div style='color:#ff4d4d;font-weight:700;'>Endereço aparenta ser um contrato de token. Análise de wallet abortada.</div>";
        return;
      }
    }

    // =========================
    // HEURISTIC NOTICE
    // =========================
    if (addressType === "unknown") {
      terminal.innerHTML =
        "<div style='color:#ffb84d;'>⚠️ Tipo de endereço não pôde ser determinado com certeza no Testnet. Continuando como wallet.</div>";
    }

    // =========================
    // STEP 3 — USDC TXs
    // =========================
    const res = await fetch(
      `https://testnet.arcscan.app/api?module=account&action=tokentx&contractaddress=${USDC_CONTRACT}&address=${wallet}&sort=desc`
    );
    const data = await res.json();
    const txs = data.result || [];

    clearTerminal();

    if (!txs.length) {
      terminal.innerHTML =
        "<div style='color:#aaa;'>Nenhuma transação USDC encontrada.</div>";
      resultsContainer.classList.remove("hidden");
      return;
    }

    snapTxEl.textContent = txs.length;
    snapActiveEl.innerHTML = `<span class="active-yes">Yes</span>`;
    txs.forEach(tx => appendTx(tx, wallet));
    resultsContainer.classList.remove("hidden");

  } catch (err) {
    console.error(err);
    terminal.innerHTML =
      "<div style='color:#aaa;'>Erro ao conectar à ArcScan API.</div>";
  }
}

checkBtn.onclick = runScan;
addrInput.addEventListener("keyup", e => e.key === "Enter" && runScan());

copyLinkBtn.onclick = () => {
  navigator.clipboard.writeText(
    `${location.origin}${location.pathname}?addr=${addrInput.value.trim()}`
  );
  alert("Copiado!");
};

openExpBtn.onclick = () => {
  window.open(
    `https://testnet.arcscan.app/address/${addrInput.value.trim()}`,
    "_blank"
  );
};
