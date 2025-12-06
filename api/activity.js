export default async function handler(req, res) {
    try {
        const { address } = req.query;

        if (!address || !address.startsWith("0x")) {
            return res.status(400).json({ error: "Invalid address" });
        }

        const apiURL = `https://api.arcscan.app/api?module=account&action=txlist&address=${address}&sort=desc`;

        const response = await fetch(apiURL);
        const data = await response.json();

        // ArcScan sometimes returns empty object or missing fields.
        const txs = data?.result || [];

        const transactions = [];

        for (const tx of txs) {
            const valueETH = Number(tx.value || 0) / 1e18;
            const gasCost =
                (Number(tx.gasUsed || 0) * Number(tx.gasPrice || 0)) / 1e18;

            const total = valueETH + gasCost;

            const formattedValue = valueETH.toFixed(6);
            const formattedGas = gasCost.toFixed(6);
            const formattedTotal = total.toFixed(6);

            const timestampMS = tx.timeStamp
                ? Number(tx.timeStamp) * 1000
                : null;

            transactions.push({
                hash: tx.hash,
                from: tx.from,
                to: tx.to || "",
                value: `${formattedValue} USDC`,
                gas: `${formattedGas} USDC`,
                total: `${formattedTotal} USDC`,
                time: timestampMS
                    ? new Date(timestampMS).toLocaleString()
                    : "N/A",
                link: `https://testnet.arcscan.app/tx/${tx.hash}`,
            });
        }

        return res.status(200).json({
            address,
            total: transactions.length,
            transactions,
        });
    } catch (error) {
        console.error("ACTIVITY ERROR:", error);
        return res
            .status(200)
            .json({ address: req.query.address, total: 0, transactions: [] });
    }
}
