# /setup-virtual-master

Register the Agent's virtual address master on Tempo. Run once per environment.

## Status

- **Moderato testnet** — DONE. `AGENT_MASTER_ID=0x3ead6d3d`, registered on-chain block 15460573.
  Master EOA: `0x6772787e16a7ea4c5307cc739cc5116b4b26ffc0`. Do NOT re-run on testnet.
- **Mainnet** — Not yet. Run this command again with mainnet env vars when ready to go live.

## Steps (for a new environment only)

1. Set `AGENT_MASTER_ADDRESS` to the EOA that will sign the registration tx (must be funded for gas).
2. Mine the salt:
   ```bash
   cd agent && npx tsx src/tempo/virtualAddresses.ts --setup
   ```
   Takes 30–90s. Outputs `AGENT_MASTER_ID` and `AGENT_MASTER_SALT`.
3. Add both to `.env`.
4. Register on-chain:
   ```bash
   cast send 0xfdc0000000000000000000000000000000000000 \
     "registerVirtualMaster(bytes32)" $AGENT_MASTER_SALT \
     --private-key $AGENT_ACCESS_KEY \
     --rpc-url $TEMPO_TESTNET_RPC_URL \
     --gas-limit 500000
   ```
5. Verify derivation:
   ```bash
   cd agent && npx tsx src/tempo/virtualAddresses.ts --verify
   ```

## Safety

- `AGENT_MASTER_ID` is sacred — back it up out of band immediately. Losing it orphans all in-flight deposits.
- `keccak256(masterAddress || salt)` must satisfy the PoW constraint. `msg.sender` must equal the address the salt was mined for — salt mined for EOA `0x677...` cannot be registered from a different address.
- Testnet and mainnet use separate `AGENT_MASTER_ID` values in separate `.env` files.
