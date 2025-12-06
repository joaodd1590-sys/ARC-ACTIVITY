// api/leaderboard.js
// Serverless endpoint for computing a leaderboard of most-active wallets
// Scans the most recent LOOKBACK_BLOCKS blocks via RPC and aggregates tx counts.
// Env vars:
//   VERCEL_RPC_URL -> custom RPC (recommended), else uses https://rpc.testnet.arc.network
//   LOOKBACK_BLOCKS -> how many blocks to scan (default 250)
//   MAX_WALLETS -> how many top wallets to return (default 50)

import { ethers } from "ethers";

const RPC_URL = process.env.VERCEL_RPC_URL || "https://rpc.testnet.arc.network";
const LOOKBACK_BLOCKS = Number(process.env.LOOKBACK_BLOCKS || 250);
const MAX_WALLETS = Number(process.env.MAX_WALLETS || 50);

function fmtTs(ts) {
  if (!ts) return null;
  return new Date(ts * 1000).toISOString();
}

export default async function handler(req, res) {
  // CORS for demo / community (restrict in production)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    const latest = await provider.getBlockNumber();
    const from = Math.max(0, latest - LOOKBACK_BLOCKS + 1);

    const counts = {}; // { addressLower: { address, count, lastTs } }
    // We'll scan blocks descending (newest -> oldest) but aggregate counts for both from and to
    for (let b = latest; b >= from; b--) {
      // For performance: avoid throwing if rate-limited; try/catch per block
      try {
        const block = await provider.getBlockWithTransactions(b);
        if (!block || !block.transactions) continue;

        for (const tx of block.transactions) {
          if (!tx) continue;
          const ts = block.timestamp || Math.floor(Date.now() / 1000);

          const addAddress = (addr) => {
            if (!addr) return;
            const a = addr.toLowerCase();
            const item = counts[a] || { address: addr, count: 0, lastTs: 0 };
            item.count += 1;
            if (ts > item.lastTs) item.lastTs = ts;
            counts[a] = item;
          };

          // count both from and to
          if (tx.from) addAddress(tx.from);
          if (tx.to) addAddress(tx.to);
        }
      } catch (blkErr) {
        // if a single block fails (rate-limit), skip it to keep partial results
        console.warn(`Skipping block ${b} due to error:`, blkErr && blkErr.message);
      }
    }

    // Convert counts map into array and sort
    const arr = Object.values(counts)
      .map((it) => ({
        address: it.address,
        count: it.count,
        lastInteraction: fmtTs(it.lastTs)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_WALLETS);

    return res.json({
      network: "Arc Testnet",
      scannedBlocks: LOOKBACK_BLOCKS,
      latestBlock: latest,
      top: arr
    });

  } catch (err) {
    console.error("leaderboard error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ error: "Internal error computing leaderboard", details: err.message });
  }
}
