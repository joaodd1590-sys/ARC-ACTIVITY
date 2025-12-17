const ARC_RPC = "https://testnet-rpc.arc.network";
const ARC_SCAN =
  "https://testnet.arcscan.app/api?module=account&action=txlist";

const SYMBOL_CALL = "0x95d89b41"; // symbol()

const tokenCache = {};

async function getTokenSymbol(contract) {
  if (
    !contract ||
    contract === "0x0000000000000000000000000000000000000000"
  ) {
    return "ARC";
  }

  if (tokenCache[contract]) return tokenCache[contract];

  try {
    const r = await fetch(ARC_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to: contract, data: SYMBOL_CALL }, "latest"],
      }),
    });

    const j = await r.json();
    if (!j.result) throw new Error("no symbol");

    const hex = j.result.replace(/^0x/, "");
    const symbol = Buffer.from(hex, "hex")
      .toString("utf8")
      .replace(/\0/g, "")
      .trim();

    tokenCache[contract] = symbol || "Unknown";
    return tokenCache[contract];
  } catch {
    return "Unknown";
  }
}

export default async function handler(req, res) {
  try {
    const { address } = req.query;

    if (!address || !address.startsWith("0x")) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const r = await fetch(`${ARC_SCAN}&address=${address}&sort=desc`);
    const json = await r.json();

    if (!json || !json.result) {
      return res.status(200).json({
        address,
        total: 0,
        transactions: [],
      });
    }

    const txs = [];

    for (const tx of json.result) {
      let raw = tx.value || "0";
      if (raw.startsWith("0x")) raw = BigInt(raw).toString();

      const value = Number(BigInt(raw)) / 1e18;

      const token = tx.contractAddress
        ? await getTokenSymbol(tx.contractAddress)
        : "ARC";

      txs.push({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        total: value.toFixed(6),
        token,
        time: new Date(Number(tx.timeStamp) * 1000).toISOString(),
        link: `https://testnet.arcscan.app/tx/${tx.hash}`,
      });
    }

    res.status(200).json({
      address,
      total: txs.length,
      transactions: txs,
    });
  } catch (err) {
    console.error("ACTIVITY ERROR:", err);
    res.status(500).json({ error: "server error" });
  }
}
