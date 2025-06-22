#!/bin/bash

# Initial zero at depth 0 (your leaf node hash)
z=0x1f9c815bb3f29ba2fc3f19b72e48938aed2707689809bde3eccc309ba32fe917

# Contract address where Poseidon2 is deployed
addr=0x5FbDB2315678afecb367f032d93F642f64180aa3
fn="hash_2(uint256,uint256)"

echo "function zeros(uint32 i) public pure returns (bytes32) {"

for i in {0..31}; do
  if [ "$i" -eq 0 ]; then
    echo "    if (i == $i) { return bytes32($z); }"
  else
    echo "    else if (i == $i) { return bytes32($z); }"
  fi
  z=$(cast call $addr "$fn" $z $z)
done

echo "    else { revert(\"Index out of bounds\"); }"
echo "}"
