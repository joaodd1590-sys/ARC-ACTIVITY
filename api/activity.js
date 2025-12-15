export default async function handler(req, res) {
  try {
    const { address } = req.query;

    if (!address || !address.startsWith("0x")) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const url = `https://testnet.arcscan.app/api?module=account&action=txlist&address=${address}&sort=desc`;
    const r = await fetch(url);
    const json = await r.json();

    if (!json || !json.result) {
      return res.status(200).json({ address, total: 0, transactions: [] });
    }

    const txs = json.result.map(tx => {
      // VALUE (BigInt)
      let rawValue = tx.value || "0";
      if (rawValue.startsWith("0x")) {
        rawValue = BigInt(rawValue).toString();
      }
      const valueWei = BigInt(rawValue);
      const valueArc = Number(valueWei) / 1e18; // safe now

      // GAS (BigInt)
      const gasUsed = BigInt(tx.gasUsed || "0");
      const gasPrice = BigInt(tx.gasPrice || "0");
      const gasWei = gasUsed * gasPrice;
      const gasArc = Number(gasWei) / 1e18;

      // TOTAL
      const totalArc = valueArc + gasArc;

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: valueArc.toFixed(6) + " Usdc",
        gas: gasArc.toFixed(6) + " Usdc",
        total: totalArc.toFixed(6) + " Usdc",
        time: new Date(Number(tx.timeStamp) * 1000).toLocaleString(),
        link: `https://testnet.arcscan.app/tx/${tx.hash}`
      };
    });

    res.status(200).json({
      address,
      total: txs.length,
      transactions: txs
    });

  } catch (err) {
    console.error("ACTIVITY ERROR", err);
    res.status(500).json({ error: "server error" });
  }
}
