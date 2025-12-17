const addrInput = document.getElementById("addr");
const checkBtn = document.getElementById("check");
const results = document.getElementById("resultsContainer");
const terminal = document.getElementById("terminal");

// Summary fields
const sumWallet = document.getElementById("sumWallet");
const sumTotal = document.getElementById("sumTotal");
const sumFirst = document.getElementById("sumFirst");
const sumLast = document.getElementById("sumLast");
const sumDays = document.getElementById("sumDays");
const sumActive = document.getElementById("sumActive");
const sumNetFlow = document.getElementById("sumNetFlow");
const sumIntensity = document.getElementById("sumIntensity");

// Filter state
let currentTxs = [];
let currentAddress = "";
let currentFilter = "all";

checkBtn.addEventListener("click", scanWallet);

/* =========================
   FILTER BUTTONS
========================= */
document.addEventListener("click", e => {
  if (!e.target.classList.contains("filter-btn")) return;

  document.querySelectorAll(".filter-btn").forEach(btn =>
    btn.classList.remove("active")
  );

  e.target.classList.add("active");
  currentFilter = e.target.dataset.filter;
  renderTransactions();
});

/* =========================
   HELPERS
========================= */
function formatAddress(addr) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/* =========================
   MAIN SCAN
========================= */
async function scanWallet() {
  const address = addrInput.value.trim();
  if (!address || !address.startsWith("0x")) {
    alert("Invalid wallet address");
    return;
  }

  terminal.innerHTML = "";
  results.classList.add("hidden");

  let data;
  try {
    const res = await fetch(`/api/activity?address=${address}`);
    data = await res.json();
  } catch {
    alert("Failed to fetch activity data");
    return;
  }

  if (!data.transactions || data.transactions.length === 0) {
    alert("No transactions found");
    return;
  }

  currentTxs = data.transactions;
  currentAddress = address;

  const totalTx = currentTxs.length;

  /* =========================
     SUMMARY
  ========================= */
  sumWallet.textContent = formatAddress(address);
  sumTotal.textContent = totalTx;

  const times = currentTxs.map(tx => new Date(tx.time).getTime());
  const first = new Date(Math.min(...times));
  const last = new Date(Math.max(...times));

  sumFirst.textContent = first.toLocaleDateString();
  sumLast.textContent = last.toLocaleDateString();

  const diffDays = Math.max(
    1,
    Math.ceil((last - first) / (1000 * 60 * 60 * 24))
  );

  sumDays.textContent = `${diffDays} days`;

  sumActive.textContent = "Yes";
  sumActive.className = "value status-yes";

  /* =========================
     NET FLOW
  ========================= */
  let inCount = 0;
  let outCount = 0;

  currentTxs.forEach(tx => {
    if (tx.from.toLowerCase() === address.toLowerCase()) {
      outCount++;
    } else {
      inCount++;
    }
  });

  const netFlow = inCount - outCount;

  if (netFlow > 0) {
    sumNetFlow.textContent = `+${netFlow} IN`;
    sumNetFlow.className = "value net-in";
  } else if (netFlow < 0) {
    sumNetFlow.textContent = `${netFlow} OUT`;
    sumNetFlow.className = "value net-out";
  } else {
    sumNetFlow.textContent = "Neutral";
    sumNetFlow.className = "value net-neutral";
  }

  /* =========================
     ACTIVITY INTENSITY
  ========================= */
  const txPerDay = totalTx / diffDays;

  if (txPerDay < 0.2) {
    sumIntensity.textContent = "Low";
    sumIntensity.className = "value intensity-low";
  } else if (txPerDay < 1) {
    sumIntensity.textContent = "Medium";
    sumIntensity.className = "value intensity-medium";
  } else {
    sumIntensity.textContent = "High";
    sumIntensity.className = "value intensity-high";
  }

  renderTransactions();
  results.classList.remove("hidden");
}

/* =========================
   RENDER TRANSACTIONS
========================= */
function renderTransactions() {
  terminal.innerHTML = "";

  currentTxs.forEach(tx => {
    const isOut =
      tx.from.toLowerCase() === currentAddress.toLowerCase();

    if (currentFilter === "in" && isOut) return;
    if (currentFilter === "out" && !isOut) return;

    const el = document.createElement("div");
    el.className = "tx";

    el.innerHTML = `
      <div class="tx-top">
        <div class="addresses">
          <div class="addr-label">From</div>
          <div class="addr-value">${tx.from}</div>
          <div class="addr-label">To</div>
          <div class="addr-value">${tx.to}</div>
        </div>

        <span class="${isOut ? "badge-out" : "badge-in"}">
          ${isOut ? "OUT" : "IN"}
        </span>
      </div>

      <div class="tx-bottom">
        <div class="tx-meta">
          <span class="tx-value">${tx.total}</span>
          <span class="tx-sep">•</span>
          <span class="tx-time">${tx.time}</span>
        </div>

        <div class="tx-actions">
          <button class="btn-secondary copy-btn">Copy</button>
          <a
            class="btn-secondary"
            href="https://testnet.arcscan.app/tx/${tx.hash}"
            target="_blank"
          >
            Explorer
          </a>
        </div>
      </div>
    `;

    const copyBtn = el.querySelector(".copy-btn");
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(tx.hash);
      copyBtn.textContent = "Copied!";
      copyBtn.classList.add("btn-copied");

      setTimeout(() => {
        copyBtn.textContent = "Copy";
        copyBtn.classList.remove("btn-copied");
      }, 1200);
    });

    terminal.appendChild(el);
  });
}
