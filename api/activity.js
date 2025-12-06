export default async function handler(req, res) {
  try {
    const { address } = req.query;
    if (!address || !address.startsWith("0x"))
      return res.status(400).json({ error: "Invalid address" });

    const url = `https://testnet.arcscan.app/api?module=account&action=txlist&address=${address}`;
    const r = await fetch(url);
    const data = await r.json();

    if (!data || !data.result)
      return res.status(200).json({ transactions: [] });

    const txs = data.result.map(tx => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: (Number(tx.value) / 1e18).toFixed(4),
      time: new Date(tx.timeStamp * 1000).toLocaleString(),
      link: `https://testnet.arcscan.app/tx/${tx.hash}`
    })).sort((a, b) => (a.timeStamp < b.timeStamp ? 1 : -1));

    res.status(200).json({
      address,
      total: txs.length,
      transactions: txs
    });

  } catch (err) {
    console.error("ACTIVITY ERROR:", err);
    res.status(500).json({ error: "server error" });
  }
}
