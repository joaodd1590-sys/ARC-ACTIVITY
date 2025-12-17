import fetch from "node-fetch";

const ARC_API = "https://testnet.arcscan.app/api";

const TEST_WALLET = "0x63a131657cdc57865df571e2e61e2eff6ee0c1c8";

export async function fetchTransactions() {
  const url = `${ARC_API}?module=account&action=txlist&address=${TEST_WALLET}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "1") {
    console.log("No transactions found or API error");
    return [];
  }

  return data.result;
}
