import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return res.status(500).json({ error: "Missing Supabase credentials" });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch ALL transactions
    const { data: txs, error } = await supabase
      .from("transactions")
      .select("*")
      .order("block_timestamp", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: "Database fetch failed." });
    }

    if (!txs || txs.length === 0) {
      return res.status(200).json({ top: [] });
    }

    // Count activity per wallet
    const activity = new Map();

    txs.forEach(tx => {
      const from = tx.from_address?.toLowerCase();
      const to = tx.to_address?.toLowerCase();
      const time = tx.block_timestamp;

      if (from) {
        if (!activity.has(from)) activity.set(from, { address: from, count: 0, lastInteraction: time });
        activity.get(from).count++;
      }

      if (to) {
        if (!activity.has(to)) activity.set(to, { address: to, count: 0, lastInteraction: time });
        activity.get(to).count++;
      }
    });

    // Convert map to sorted array
    const ranking = Array.from(activity.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 50); // max

    return res.status(200).json({ top: ranking });

  } catch (err) {
    console.error("Leaderboard API error:", err);
    return res.status(500).json({ error: "Server failure." });
  }
}
