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
      const valueEth = Number(tx.value || "0") / 1e18;
      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: valueEth.toFixed(4) + " ETH",
        time: new Date(Number(tx.timeStamp) * 1000).toLocaleString(),
        link: `https://testnet.arcscan.app/tx/${tx.hash}`,
        timeStamp: Number(tx.timeStamp)
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
