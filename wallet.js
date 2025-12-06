// api/wallet.js
// Serverless endpoint (Vercel / Netlify functions style)
// Recebe GET ?address=0x... ou POST { address: "0x..." }
// Retorna JSON com balance, txCount, heurística de atividade, first/last tx (lookback)

const { ethers } = require("ethers");

const RPC_URL = process.env.VERCEL_RPC_URL || "https://rpc.testnet.arc.network";
const LOOKBACK_BLOCKS = Number(process.env.LOOKBACK_BLOCKS || 120); // ajustável

// helper
function fmtTs(ts) {
  if (!ts) return null;
  return new Date(ts * 1000).toISOString();
}

module.exports = async (req, res) => {
  // Allow CORS from anywhere (pode restringir ao seu domínio depois)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const address = (req.method === "GET" ? req.query.address : req.body?.address) || "";
    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid or missing address" });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // Basic info
    const [balanceBn, txCountOutgoing, latestBlock] = await Promise.all([
      provider.getBalance(address),
      provider.getTransactionCount(address),
      provider.getBlockNumber()
    ]);

    // Scan last N blocks for transactions touching the address (heuristic, light)
    const from = Math.max(0, latestBlock - LOOKBACK_BLOCKS);
    let totalSeen = 0;
    let firstTs = null;
    let lastTs = null;
    const contracts = new Set();

    // loop blocks descending to find last -> first (but we'll set firstTs to earliest found)
    for (let b = latestBlock; b >= from; b--) {
      // getBlockWithTransactions may be rate-limited; keep lookback moderate
      const block = await provider.getBlockWithTransactions(b);
      if (!block || !block.transactions) continue;

      for (const tx of block.transactions) {
        if (!tx) continue;
        const fromLower = tx.from ? tx.from.toLowerCase() : null;
        const toLower = tx.to ? tx.to.toLowerCase() : null;
        const addrLower = address.toLowerCase();

        if (fromLower === addrLower || toLower === addrLower) {
          totalSeen++;
          // set lastTs as newest found
          if (!lastTs) lastTs = block.timestamp;
          // keep updating firstTs to the smallest timestamp found (we iterate descending, so set and override later)
          firstTs = block.timestamp;
          if (tx.to && tx.data && tx.data !== "0x") {
            contracts.add(tx.to.toLowerCase());
          } else if (tx.to) {
            // we can't easily know if it's contract or EOA - ignore
          }
        }
      }
    }

    // isActive heuristic: positive balance or any tx seen
    const isActive = (balanceBn > 0n) || (txCountOutgoing + totalSeen > 0);

    return res.json({
      wallet: address,
      balance: ethers.formatEther(balanceBn),
      txCountOutgoing,
      scannedBlocks: LOOKBACK_BLOCKS,
      latestBlock,
      seenInLookback: totalSeen,
      contractsInteracted: Array.from(contracts).slice(0, 30),
      contractsCount: contracts.size,
      firstInteraction: firstTs ? fmtTs(firstTs) : null,
      lastInteraction: lastTs ? fmtTs(lastTs) : null,
      isActive
    });
  } catch (err) {
    console.error("wallet endpoint error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ error: "Internal error contacting RPC or rate-limited" });
  }
};
