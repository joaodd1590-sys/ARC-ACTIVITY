// ===============================
//  ARC ACTIVITY TRACKER BACKEND
// ===============================

// ArcScan API endpoint (testnet)
const ARCSCAN_API = "https://api.arcscan.net/v1/transactions?address=";

// Atualiza o frontend com os dados da carteira
export async function fetchWalletActivity(address) {
    try {
        const url = `${ARCSCAN_API}${address}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data || !data.transactions) {
            return { transactions: [] };
        }

        return {
            transactions: data.transactions.map(formatTx),
        };

    } catch (err) {
        console.error("API ERROR:", err);
        return { transactions: [] };
    }
}

// ===============================
//  FORMATADOR DE TRANSAÇÕES
// ===============================

function formatTx(tx) {
    const hash = tx.hash;
    const from = tx.from || "--";
    const to = tx.to || "--";
    const timestamp = tx.timestamp ? new Date(tx.timestamp * 1000) : null;
    const timeStr = timestamp ? timestamp.toLocaleString() : "--";

    // -----------------------------
    // CORREÇÃO DEFINITIVA DO "NaN USDC"
    // -----------------------------
    let rawValue = tx.value;

    // Se vier undefined, null, "" → vira 0
    if (!rawValue) rawValue = 0;

    // Se vier como hex → converter
    if (typeof rawValue === "string" && rawValue.startsWith("0x")) {
        rawValue = parseInt(rawValue, 16);
    }

    // Converte para número apropriado (token ARC USDC = 6 decimals)
    const valueUSDC = Number(rawValue) / 1e6;

    // GARANTE que nunca vira NaN
    const safeValue = isNaN(valueUSDC) ? 0 : valueUSDC;

    // -----------------------------

    return {
        hash,
        from,
        to,
        value: safeValue.toFixed(4),
        time: timeStr,
        direction: null, // definido no frontend
        link: `https://arcscan.net/tx/${hash}`
    };
}

// ===============================
//  LEADERBOARD (DESATIVADO)
// ===============================

export async function fetchLeaderboard() {
    return {
        top: [],
        error: "Leaderboard Coming Soon"
    };
}
