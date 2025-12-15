async function runScan() {
  const wallet = addrInput.value.trim().toLowerCase();

  if (!wallet.startsWith("0x") || wallet.length !== 42) {
    alert("Endereço inválido.");
    return;
  }

  // Known USDC contract - immediate reject
  const USDC_CONTRACT = "0x3600000000000000000000000000000000000000";
  if (wallet === USDC_CONTRACT.toLowerCase()) {
    terminal.innerHTML = "<div style='color:#ff4d4d; font-weight:700;'>This is the USDC token contract, not a wallet address.</div>";
    resultsContainer.classList.add("hidden");
    return;
  }

  resultsContainer.classList.add("hidden");
  terminal.innerHTML = "<div style='color:#aaa;'>Checking address type & loading USDC activity...</div>";

  snapWalletEl.textContent = shortAddr(wallet);
  snapTxEl.textContent = "0";
  snapActiveEl.innerHTML = `<span class="active-no">No</span>`;

  try {
    // Step 1: Check normal transactions (txlist) to detect EOA
    const txlistUrl = `https://testnet.arcscan.app/api?module=account&action=txlist&address=${wallet}&sort=desc`;
    const txlistRes = await fetch(txlistUrl);
    const txlistData = await txlistRes.json();

    let hasNormalTxs = false;
    if (txlistData.status === "1" && Array.isArray(txlistData.result) && txlistData.result.length > 0) {
      hasNormalTxs = true;
    }

    // If has normal txs → definitely wallet, proceed
    if (!hasNormalTxs) {
      // Step 2: Check tokeninfo as heuristic for contract
      const tokenInfoUrl = `https://testnet.arcscan.app/api?module=token&action=tokeninfo&contractaddress=${wallet}`;
      const tokenRes = await fetch(tokenInfoUrl);
      const tokenData = await tokenRes.json();

      if (tokenData.status === "1" && tokenData.result && tokenData.result.tokenName) {
        terminal.innerHTML = "<div style='color:#ff4d4d; font-weight:700;'>Address is a token contract, not a wallet.</div>";
        resultsContainer.classList.add("hidden");
        return;
      }

      // Optional: If still unsure, you could add more checks (e.g., balance via proxy if needed)
    }

    // Proceed with USDC token transfers (existing logic)
    const url = `https://testnet.arcscan.app/api?module=account&action=tokentx&contractaddress=${USDC_CONTRACT}&address=${wallet}&sort=desc`;

    const res = await fetch(url);
    const data = await res.json();
    const txs = data.result || [];

    clearTerminal();

    if (!txs.length) {
      terminal.innerHTML = "<div style='color:#aaa;'>No USDC transactions found. This is an inactive wallet.</div>";
      snapTxEl.textContent = "0";
      snapActiveEl.innerHTML = `<span class="active-no">No</span>`;
      resultsContainer.classList.remove("hidden");
      return;
    }

    txs.sort((a, b) => Number(b.timeStamp) - Number(a.timeStamp)); // newest first

    snapTxEl.textContent = txs.length;
    snapActiveEl.innerHTML = `<span class="active-yes">Yes</span>`;

    txs.forEach(tx => appendTx(tx, wallet));

    resultsContainer.classList.remove("hidden");

  } catch (err) {
    terminal.innerHTML = "<div style='color:#aaa;'>Error connecting to ArcScan API.</div>";
    console.error(err);
  }
}
