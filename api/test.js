export default async function handler(req, res) {
  const address = "0x63a131657cdc57865df571e2e61e2eff6ee0c1c8";

  const endpoints = [
    `https://api.arcscan.app/v1/txs/address/${address}?limit=50`,
    `https://api.arcscan.app/v1/address/${address}/txs?limit=50`,
    `https://api.arcscan.app/api/txs/address/${address}`,
    `https://api.arcscan.app/address/${address}/txs`,
    `https://testnet.arcscan.app/api/txs/address/${address}`,
    `https://testnet.arcscan.app/v1/txs/address/${address}`,
  ];

  const results = [];

  for (const url of endpoints) {
    try {
      const r = await fetch(url);
      results.push({ url, status: r.status });
    } catch (err) {
      results.push({ url, error: err.toString() });
    }
  }

  res.status(200).json(results);
}
