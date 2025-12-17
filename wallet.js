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

checkBtn.addEventListener("click", scanWallet);

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

  const txs = data.transactions;
  const totalTx = txs.length;

  // ================= SUMMARY =================
  sumWallet.textContent = address;
  sumTotal.textContent = totalTx;

  const times = txs.map(tx => new Date(tx.time).getTime());
  const first = new Date(Math.min(...times));
  const last = new Date(Math.max(...times));

  sumFirst.textContent = first.toLocaleDateString();
  sumLast.textContent = last.toLocaleDateString();

  const diffDays = Math.max(
    1,
    Math.ceil((last - first) / (1000 * 60 * 60 * 24))
  );

  sumDays.textContent = `${diffDays} days`;

  // Active
  sumActive.textContent = "Yes";
  sumActive.className = "value status-yes";

  // ================= NET FLOW =================
  let inCount = 0;
  let outCount = 0;

  txs.forEach(tx => {
    if (tx.from.toLowerCase() === address.toLowerCase()) {
      outCount++;
    } else {
      inCount++;
    }
  });

  const netFlow = inCount - outCount;

  if (netFlow > 0) {
    sumNetFlow.textContent = `+${netFlow} IN`;
    sumNetFlow.style.color = "#22c55e";
  } else if (netFlow < 0) {
    sumNetFlow.textContent = `${netFlow} OUT`;
    sumNetFlow.style.color = "#ef4444";
  } else {
    sumNetFlow.textContent = "Neutral";
    sumNetFlow.style.color = "#9ba3b5";
  }

  // ================= ACTIVITY INTENSITY =================
  const txPerDay = totalTx / diffDays;

  if (txPerDay < 0.2) {
    sumIntensity.textContent = "Low";
    sumIntensity.style.color = "#9ba3b5";
  } else if (txPerDay < 1) {
    sumIntensity.textContent = "Medium";
    sumIntensity.style.color = "#facc15";
  } else {
    sumIntensity.textContent = "High";
    sumIntensity.style.color = "#22c55e";
  }

  // ================= TRANSACTIONS =================
  txs.forEach(tx => {
    const el = document.createElement("div");
    el.className = "tx";

    const isOut = tx.from.toLowerCase() === address.toLowerCase();

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
          <div class="tx-value">${tx.total}</div>
          <div class="tx-time">${tx.time}</div>
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

    // Copy logic
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

  results.classList.remove("hidden");
}
