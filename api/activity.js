export default async function handler(req, res) {
  try {
    const { address } = req.query;

    if (!address || !address.startsWith("0x")) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const base = "https://testnet.arcscan.app/api";

    // ARC native txs
    const nativeReq = fetch(
      `${base}?module=account&action=txlist&address=${address}&sort=desc`
    );

    // ERC20 txs (USDC, EURC, etc)
    const tokenReq = fetch(
      `${base}?module=account&action=tokentx&address=${address}&sort=desc`
    );

    const [nativeRes, tokenRes] = await Promise.all([nativeReq, tokenReq]);
    const nativeJson = await nativeRes.json();
    const tokenJson = await tokenRes.json();

    const txs = [];

    // ===== ARC native =====
    if (nativeJson?.result) {
      for (const tx of nativeJson.result) {
        if (tx.value === "0") continue;

        const value = Number(tx.value) / 1e18;

        txs.push({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          total: value.toFixed(6),
          token: "ARC",
          time: new Date(Number(tx.timeStamp) * 1000).toISOString(),
          link: `https://testnet.arcscan.app/tx/${tx.hash}`,
        });
      }
    }

    // ===== ERC20 =====
    if (tokenJson?.result) {
      for (const tx of tokenJson.result) {
        const value =
          Number(tx.value) / Math.pow(10, Number(tx.tokenDecimal));

        txs.push({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          total: value.toFixed(6),
          token: tx.tokenSymbol,
          time: new Date(Number(tx.timeStamp) * 1000).toISOString(),
          link: `https://testnet.arcscan.app/tx/${tx.hash}`,
        });
      }
    }

    // Sort newest first
    txs.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.status(200).json({
      address,
      total: txs.length,
      transactions: txs,
    });
  } catch (err) {
    console.error("ACTIVITY ERROR", err);
    res.status(500).json({ error: "server error" });
  }
}
