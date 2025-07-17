import { ethers } from "ethers";
import { CompiledCircuit, Noir } from "@noir-lang/noir_js";
import { Barretenberg, Fr, UltraHonkBackend } from "@aztec/bb.js";
import circuit from "@/utils/circuit.json";
import { merkleTree } from "./merkletTree";
/**
 *
 * @returns The output is ABI-encoded as [commitment,nullifier,secret]
 */
export async function generateCommitments() {
  console.log("Generating the commitment");
  const nullifier = Fr.random();
  const secret = Fr.random();

  //   const commitment = await bb.poseidon2Hash([nullifier, secret]);
  const commitment = await generateHash([nullifier, secret]);
  const result = ethers.AbiCoder.defaultAbiCoder().encode(
    ["bytes32", "bytes32", "bytes32"],
    [commitment.toBuffer(), nullifier.toBuffer(), secret.toBuffer()]
  );
  return result;
}
export type CircuitInputProof = {
  nullifier: string;
  secret: string;
  _recipient: string;
  leaves: string[];
};
export async function generateProofs({
  nullifier,
  secret,
  _recipient,
  leaves,
}: CircuitInputProof) {
  const noir = new Noir(circuit as CompiledCircuit);
  const backend = new UltraHonkBackend(circuit.bytecode);
  const merkle_tree = await merkleTree(leaves);
  //public
  const commitment = await generateHash([
    Fr.fromString(nullifier),
    Fr.fromString(secret),
  ]);
  // pathIndices[] and pathElements[]
  const merkle_proof = merkle_tree.proof(
    merkle_tree.getIndex(commitment.toString())
  );
  const nullifier_hash = (
    await generateHash([Fr.fromString(nullifier)])
  ).toString();
  const inputs = {
    root: merkle_proof.root,
    nullifier_hash,
    _recipient,
    // private inputs
    nullifier,
    secret,
    merkle_proof: merkle_proof.pathElements,
    is_even: merkle_proof.pathIndices.map((el) => el % 2 == 0),
  };
  const { witness } = await noir.execute(inputs);
  const { proof, publicInputs } = await backend.generateProof(witness, {
    keccak: true,
  });
  const result = ethers.AbiCoder.defaultAbiCoder().encode(
    ["bytes", "bytes32[]"],
    [proof, publicInputs]
  );
  return result;
}

async function generateHash(input: Fr[]): Promise<Fr> {
  const bb = await Barretenberg.new();
  const hash = await bb.poseidon2Hash(input);
  return hash;
}
