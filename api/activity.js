export default async function handler(req, res) {
  try {
    const { address } = req.query;

    if (!address || !address.startsWith("0x")) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const base = "https://testnet.arcscan.app/api";

    const [nativeRes, tokenRes] = await Promise.all([
      fetch(`${base}?module=account&action=txlist&address=${address}&sort=desc`),
      fetch(`${base}?module=account&action=tokentx&address=${address}&sort=desc`)
    ]);

    const nativeJson = await nativeRes.json();
    const tokenJson = await tokenRes.json();

    const txs = [];

    /* =========================
       ERC20 TOKENS (USDC, EURC)
    ========================= */
    if (tokenJson?.result) {
      for (const tx of tokenJson.result) {
        txs.push({
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
        });
      }
    }

    /* =========================
       NATIVE (somente se value > 0)
       Rotulado como NATIVE (não ARC)
    ========================= */
    if (nativeJson?.result) {
      for (const tx of nativeJson.result) {
        if (tx.value === "0") continue;

        txs.push({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          total: (Number(tx.value) / 1e18).toFixed(6),
          token: "NATIVE",
          time: new Date(Number(tx.timeStamp) * 1000).toISOString(),
          link: `https://testnet.arcscan.app/tx/${tx.hash}`
        });
      }
    }

    /* =========================
       ORDER BY TIME DESC
    ========================= */
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
