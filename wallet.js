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

  // ---- WALLET SUMMARY ----
  sumWallet.textContent = address;
  sumTotal.textContent = data.transactions.length;

  const times = data.transactions.map(tx => new Date(tx.time).getTime());
  const first = new Date(Math.min(...times));
  const last = new Date(Math.max(...times));

  sumFirst.textContent = first.toLocaleDateString();
  sumLast.textContent = last.toLocaleDateString();

  const diffDays = Math.max(
    1,
    Math.ceil((last - first) / (1000 * 60 * 60 * 24))
  );

  sumDays.textContent = `${diffDays} days`;

  // ---- TRANSACTIONS ----
  data.transactions.forEach(tx => {
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
