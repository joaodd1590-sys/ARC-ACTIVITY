// ARC Testnet USDC contract
const USDC_CONTRACT = "0x3600000000000000000000000000000000000000";

const addrInput = document.getElementById("addr");
const checkBtn = document.getElementById("check");
const terminal = document.getElementById("terminal");
const resultsContainer = document.getElementById("resultsContainer");

const snapWalletEl = document.getElementById("snapWallet");
const snapTxEl = document.getElementById("snapTx");
const snapActiveEl = document.getElementById("snapActive");

const txFilter = document.getElementById("txFilter");
const filterBtns = document.querySelectorAll(".filter-btn");

let allTxs = [];
let currentWallet = "";

function shortAddr(a) {
  return a.slice(0, 6) + "..." + a.slice(-4);
}

function clearTerminal() {
  terminal.innerHTML = "";
}

function appendTx(tx, wallet) {
  const isOut = tx.from.toLowerCase() === wallet.toLowerCase();
  const dir = isOut ? "OUT" : "IN";

  const el = document.createElement("div");
  el.className = "tx";
  el.innerHTML = `
    <strong>${dir}</strong><br/>
    From: ${shortAddr(tx.from)}<br/>
    To: ${shortAddr(tx.to)}<br/>
    Value: ${tx.value}
  `;
  terminal.prepend(el);
}

async function runScan() {
  const wallet = addrInput.value.trim();
  if (!wallet.startsWith("0x")) return alert("Invalid wallet");

  currentWallet = wallet;
  clearTerminal();
  resultsContainer.innerHTML = "";
  txFilter.classList.add("hidden");

  snapWalletEl.textContent = shortAddr(wallet);

  const res = await fetch(
    `https://testnet.arcscan.app/api?module=account&action=tokentx&contractaddress=${USDC_CONTRACT}&address=${wallet}`
  );

  const data = await res.json();
  allTxs = data.result || [];

  snapTxEl.textContent = allTxs.length;
  snapActiveEl.textContent = allTxs.length > 0 ? "Yes" : "No";

  txFilter.classList.remove("hidden");
  renderFiltered("all");
}

function renderFiltered(type) {
  clearTerminal();

  const filtered = allTxs.filter(tx => {
    const isOut = tx.from.toLowerCase() === currentWallet.toLowerCase();
    if (type === "in") return !isOut;
    if (type === "out") return isOut;
    return true;
  });

  filtered.forEach(tx => appendTx(tx, currentWallet));
}

filterBtns.forEach(btn => {
  btn.onclick = () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderFiltered(btn.dataset.filter);
  };
});

checkBtn.onclick = runScan;
