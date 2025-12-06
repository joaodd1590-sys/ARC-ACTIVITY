const scanBtn = document.getElementById("scanBtn");
const walletInput = document.getElementById("walletInput");
const results = document.getElementById("results");
const statusBox = document.getElementById("statusBox");

scanBtn.onclick = async () => {
    const address = walletInput.value.trim();
    if (!address) return alert("Enter a wallet address");

    statusBox.textContent = "Scanning…";

    const res = await fetch(`/api/activity?address=${address}`);
    const data = await res.json();

    if (!data || data.error) {
        statusBox.textContent = "Error fetching activity.";
        return;
    }

    document.getElementById("snapAddress").textContent = address;
    document.getElementById("snapCount").textContent = data.total;
    document.getElementById("snapActive").textContent = data.total > 0 ? "Yes" : "No";

    // load tx list
    const txList = document.getElementById("txList");
    txList.innerHTML = "";

    data.transactions.forEach(tx => {
        const div = document.createElement("div");
        div.className = "tx-item";
        div.innerHTML = `
            <b>${tx.hash.slice(0,12)}...</b>  
            <br>From: ${tx.from}  
            <br>To: ${tx.to}  
            <br>Value: ${tx.value}  
            <br>Time: ${tx.time}
            <br><button onclick="copy('${tx.hash}')">Copy Hash</button>
            <button onclick="window.open('https://testnet.arcscan.app/tx/${tx.hash}')">Explorer</button>
        `;
        txList.appendChild(div);
    });

    results.classList.remove("hidden");
    statusBox.textContent = "Scan complete.";
};

function copy(text) {
    navigator.clipboard.writeText(text);
    alert("Copied!");
}
