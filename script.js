async function connectWallet() {
    if (typeof window.ethereum !== "undefined") {
        try {
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts"
            });

            document.getElementById("status").innerText =
                "Connected: " + accounts[0];

        } catch (error) {
            console.error(error);
            alert("Failed to connect wallet.");
        }
    } else {
        alert("MetaMask not detected!");
    }
}
