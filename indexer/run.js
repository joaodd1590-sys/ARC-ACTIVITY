import { fetchTransactions } from "./fetchTxs.js";

async function run() {
  console.log("Fetching ARC transactions...");

  const txs = await fetchTransactions();

  console.log("Transactions fetched:", txs.length);

  if (txs.length > 0) {
    console.log("Sample tx:", txs[0]);
  }
}

run();
