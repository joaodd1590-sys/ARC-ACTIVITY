export default async function handler(req, res) {
  try {
    const { address } = req.query;

    if (!address || !address.startsWith("0x")) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const base = "https://testnet.arcscan.app/api";

    const tokenRes = await fetch(
      `${base}?module=account&action=tokentx&address=${address}&sort=desc`
    );

    const tokenJson = await tokenRes.json();

    if (!tokenJson?.result) {
      return res.status(200).json({
        address,
        total: 0,
        transactions: []
      });
    }

    const txs = tokenJson.result.map(tx => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      total: (
        Number(tx.value) /
        Math.pow(10, Number(tx.tokenDecimal))
      ).toFixed(6),
      token: tx.tokenSymbol,
      time: new Date(Number(tx.timeStamp) * 1000).toISOString(),
      link: `https://testnet.arcscan.app/tx/${tx.hash}`
    }));

    // Order newest first
    txs.sort((a, b) => new Date(b.time) - new Date(a.time));

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
