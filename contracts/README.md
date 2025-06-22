# ZK Mixer Project (Tornado Cash Mizer)

- Deposit: User can deposit ETH into the mixer to break the connection between depositer and withdrawer.
- Withdraw: User will withdraw using ZK proof (Noir - generated off-chain) of knowledge of their deposit.
---
# Proof
- We need to check whether the commitment is present in Merkle Tree itself. Inputs to our proof ->
    - Proposed Root
    - Merkle Root
- Check the nullifier matches the public nullifier hash.
