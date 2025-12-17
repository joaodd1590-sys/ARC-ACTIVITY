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
const sumIntensity = document.getElementById("sumIntensity"); // NEW

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

  // ---------------- BASIC SUMMARY ----------------
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

  // ---------------- ACTIVE ----------------
  sumActive.textContent = "Yes";
  sumActive.className = "value status-yes";

  // ---------------- NET FLOW ----------------
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
  } else if (netFlow < 0) {
    sumNetFlow.textContent = `${netFlow} OUT`;
  } else {
    sumNetFlow.textContent = "Neutral";
  }

  // ---------------- ACTIVITY INTENSITY (NEW) ----------------
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

  // ---------------- TRANSACTIONS ----------------
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
        <div>${tx.total}</div>
        <div>${tx.time}</div>
      </div>
    `;

    terminal.appendChild(el);
  });

  results.classList.remove("hidden");
}
