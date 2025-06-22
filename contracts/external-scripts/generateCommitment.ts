import { Barretenberg, Fr } from "@aztec/bb.js";
import { ethers } from "ethers";

export default async function generateCommitments() {
  const bb = await Barretenberg.new();
  const nullifier = Fr.random();
  const secret = Fr.random();

  const commitment = await bb.poseidon2Hash([nullifier, secret]);
  const result = ethers.AbiCoder.defaultAbiCoder().encode(
    ["bytes32", "bytes32", "bytes32"],
    [commitment.toBuffer(), nullifier.toBuffer(), secret.toBuffer()]
  );
  return result;
}

const main = async () => {
  try {
    const commitment = await generateCommitments();
    process.stdout.write(commitment!);
    process.exit(0);
  } catch (error) {
    console.error("Error: ", error);
    process.exit(1);
  }
};
main();
