// SafeTipJar contract on ARC testnet
const CONTRACT_ADDRESS = "0x9f46FaE692A2F7A97b352bc788865E016164138f";

const ABI = [
    "function tip(uint256 amount) external",
];

let provider;
let signer;
let contract;

// Connect MetaMask
document.getElementById("connectBtn").onclick = async () => {
    if (!window.ethereum) {
        alert("MetaMask not detected!");
        return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();

    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    alert("Wallet connected!");
};

// Send tip
document.getElementById("tipBtn").onclick = async () => {
    if (!contract) {
        alert("Connect your wallet first!");
        return;
    }

    const amount = document.getElementById("amount").value;
    if (!amount || amount <= 0) {
        alert("Enter valid amount.");
        return;
    }

    try {
        const tx = await contract.tip(amount);
        await tx.wait();
        alert("Tip sent!");
    } catch (err) {
        console.error(err);
        alert("Transaction failed.");
    }
};
