export default async function handler(req, res) {
  try {
    const { address } = req.query;

    if (!address || !address.startsWith("0x")) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const url = `https://testnet.arcscan.app/api?module=account&action=tokentx&address=${address}&sort=desc`;
    const r = await fetch(url);
    const json = await r.json();

    if (!json || !Array.isArray(json.result)) {
      return res.status(200).json({
        address,
        total: 0,
        transactions: []
      });
    }

    const txs = json.result.map(tx => {
      const decimals = Number(tx.tokenDecimal || 18);
      const value =
        Number(tx.value) / Math.pow(10, decimals);

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        amount: value.toFixed(6),   // 👈 SOMENTE O NÚMERO
        token: tx.tokenSymbol,      // 👈 SOMENTE O TOKEN
        time: Number(tx.timeStamp), // 👈 TIMESTAMP PURO
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
