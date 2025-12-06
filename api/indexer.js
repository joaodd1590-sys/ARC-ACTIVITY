import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RPC_URL = process.env.VERCEL_RPC_URL || "https://rpc.testnet.arc.network";
const LOOKBACK = Number(process.env.LOOKBACK_BLOCKS || 250);

const db = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false }});
const provider = new ethers.JsonRpcProvider(RPC_URL);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const { data: last } = await db
      .from("transactions")
      .select("block_number")
      .order("block_number", { ascending: false })
      .limit(1)
      .single();

    const latestIndexed = last ? Number(last.block_number) : 0;
    const latestChain = await provider.getBlockNumber();

    let start = latestIndexed > 0 ? latestIndexed + 1 : Math.max(0, latestChain - LOOKBACK);
    let end = latestChain;

    let inserted = 0;

    for (let b = start; b <= end; b++) {
      let block;
      try {
        block = await provider.getBlockWithTransactions(b);
      } catch {
        continue;
      }

      if (!block || !block.transactions.length) continue;

      const rows = block.transactions.map(tx => ({
        id: tx.hash,
        from_address: tx.from,
        to_address: tx.to,
        value: tx.value ? BigInt(tx.value).toString() : "0",
        block_number: block.number,
        block_timestamp: new Date(block.timestamp * 1000).toISOString(),
        network: "arc-testnet"
      }));

      const { error } = await db.from("transactions").upsert(rows, { onConflict: "id" });
      if (!error) inserted += rows.length;
    }

    res.status(200).json({
      ok: true,
      indexed: inserted,
      from: start,
      to: end
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
