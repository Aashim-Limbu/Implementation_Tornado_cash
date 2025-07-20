# Zero-Knowledge-Tornado-Cash-Implementation

### Proof

- calculate commitment using secret and nullifier.
- Check commitment is present or not.
- Check the nullifier matches the (public) nullifier hash

# Generate zeros value

```zsh
forge create src/lib/src/Poseidon2.sol:Poseidon2 --rpc-url 127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast
```

### Private inputs

- Secret
- Nullifier
-

### Public Inputs

- proposed root.
- nullifier hash.
