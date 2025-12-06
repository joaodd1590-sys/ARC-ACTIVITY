export default async function handler(req, res) {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ error: "Missing wallet address" });
    }

    const rpcUrl = "https://rpc.testnet.arc.network";

    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getBalance",
      params: [address, "latest"]
    };

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    return res.status(200).json({
      address,
      balance: parseInt(data.result, 16)
    });

  } catch (err) {
    return res.status(500).json({ error: "RPC error", details: err.message });
  }
}
