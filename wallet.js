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
const sumBehavior = document.getElementById("sumBehavior");
const sumNetFlow = document.getElementById("sumNetFlow");
const sumAge = document.getElementById("sumAge");
const sumIntensity = document.getElementById("sumIntensity");

checkBtn.addEventListener("click", scanWallet);

async function scanWallet() {
  const address = addrInput.value.trim();
  if (!address.startsWith("0x")) {
    alert("Invalid wallet address");
    return;
  }

  terminal.innerHTML = "";
  results.classList.add("hidden");

  const res = await fetch(`/api/activity?address=${address}`);
  const data = await res.json();

  if (!data.transactions || data.transactions.length === 0) {
    alert("No transactions found");
    return;
  }

  const txs = data.transactions;
  const totalTx = txs.length;

  // ---- BASIC SUMMARY ----
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

  // ---- ACTIVE ----
  sumActive.textContent = "Yes";
  sumActive.className = "value status-yes";

  // ---- NET FLOW + BEHAVIOR ----
  let inCount = 0;
  let outCount = 0;

  txs.forEach(tx => {
    if (tx.from.toLowerCase() === address.toLowerCase()) {
      outCount++;
    } else {
      inCount++;
    }
  });

  // Net Flow
  const netFlow = inCount - outCount;
  sumNetFlow.textContent =
    netFlow > 0
      ? `+${netFlow} IN`
      : netFlow < 0
      ? `${netFlow} OUT`
      : "Neutral";

  // Behavior
  const inPct = inCount / totalTx;
  const outPct = outCount / totalTx;

  if (outPct > 0.6) {
    sumBehavior.textContent = "Mostly Sender";
    sumBehavior.className = "value behavior-sender";
  } else if (inPct > 0.6) {
    sumBehavior.textContent = "Mostly Receiver";
    sumBehavior.className = "value behavior-receiver";
  } else {
    sumBehavior.textContent = "Balanced";
    sumBehavior.className = "value behavior-balanced";
  }

  // ---- WALLET AGE ----
  if (diffDays < 30) {
    sumAge.textContent = "New";
    sumAge.className = "value age-new";
  } else if (diffDays < 180) {
    sumAge.textContent = "Established";
    sumAge.className = "value age-established";
  } else {
    sumAge.textContent = "Old";
    sumAge.className = "value age-old";
  }

  // ---- ACTIVITY INTENSITY ----
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

  // ---- TRANSACTIONS ----
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
