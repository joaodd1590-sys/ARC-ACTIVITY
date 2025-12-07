async function checkGas() {
    const txid = document.getElementById("txid").value.trim();
    const resBox = document.getElementById("result");

    if (!txid.startsWith("0x")) {
        resBox.innerHTML = "❌ Invalid TX hash.";
        return;
    }

    resBox.innerHTML = "⏳ Fetching transaction data...";

    try {
        // API pública do ArcScan Testnet
        const url = `https://testnet.arcscan.app/api/tx/${txid}`;
        const resp = await fetch(url);

        if (!resp.ok) {
            resBox.innerHTML = "❌ Transaction not found on Arc Testnet.";
            return;
        }

        const data = await resp.json();

        const gasUsed = data?.result?.gasUsed;
        const gasPrice = data?.result?.gasPrice;

        if (!gasUsed || !gasPrice) {
            resBox.innerHTML = "⚠️ Could not calculate gas for this transaction.";
            return;
        }

        const totalWei = BigInt(gasUsed) * BigInt(gasPrice);
        const totalArc = Number(totalWei) / 1e18;

        resBox.innerHTML = `
            <div>🔥 <b>Gas Used:</b> ${gasUsed}</div>
            <div>⛽ <b>Gas Price:</b> ${gasPrice}</div>
            <div>💰 <b>Total Cost:</b> ${totalArc.toFixed(6)} ARC</div>
        `;
    } catch (err) {
        console.error(err);
        resBox.innerHTML = "❌ Error fetching gas data.";
    }
}
