import { fetchTransactions } from "./fetchTxs.js";

console.log("Fetching ARC transactions...");

const txs = await fetchTransactions();

console.log("Transactions fetched:", txs.length);

// mostra só a primeira transação (se existir)
if (txs.length > 0) {
  console.log("Sample tx:", txs[0]);
}
