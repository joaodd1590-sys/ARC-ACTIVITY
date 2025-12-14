export default async function handler(req, res) {
  try {
    const { address } = req.query;

    // =========================
    // BASIC VALIDATION
    // =========================
    if (!address || !address.startsWith("0x") || address.length !== 42) {
      return res.status(400).json({ error: "Invalid address format" });
    }

    // =========================
    // TOKEN CONTRACT CHECK
    // =========================
    try {
      const tokenCheck = await fetch(
        `https://testnet.arcscan.app/api?module=token&action=tokeninfo&contractaddress=${address}`
      );

      const tokenJson = await tokenCheck.json();

      // Se retornar metadata → é token
      if (
        tokenJson &&
        tokenJson.result &&
        Array.isArray(tokenJson.result) &&
        tokenJson.result.length > 0
      ) {
        return res.status(400).json({
          error: "Address is a token contract, not a wallet"
        });
      }
    } catch {
      // Fail-safe: se token check falhar, continua como wallet
    }

    // =========================
    // WALLET TX LIST
    // =========================
    const url = `https://testnet.arcscan.app/api?module=account&action=txlist&address=${address}&sort=desc`;
    const r = await fetch(url);
    const json = await r.json();

    if (!json || !json.result || !Array.isArray(json.result)) {
      return res.status(200).json({
        address,
        total: 0,
        transactions: []
      });
    }

    const txs = json.result.map(tx => {
      // VALUE
      let rawValue = tx.value || "0";
      if (rawValue.startsWith("0x")) {
        rawValue = BigInt(rawValue).toString();
      }

      const valueWei = BigInt(rawValue);
      const valueArc = Number(valueWei) / 1e18;

      // GAS
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
        value: valueArc.toFixed(6) + " USDC",
        gas: gasArc.toFixed(6) + " USDC",
        total: totalArc.toFixed(6) + " USDC",
        time: new Date(Number(tx.timeStamp) * 1000).toLocaleString(),
        link: `https://testnet.arcscan.app/tx/${tx.hash}`
      };
    });

    return res.status(200).json({
      address,
      total: txs.length,
      transactions: txs
    });

  } catch (err) {
    console.error("ACTIVITY ERROR", err);
    return res.status(500).json({ error: "Server error" });
  }
}
