import { Barretenberg, UltraHonkBackend, Fr } from "@aztec/bb.js";
import { CompiledCircuit, Noir } from "@noir-lang/noir_js";
import circuit from "../../circuits/target/contracts.json";
import { ethers } from "ethers";
import { merkleTree } from "./merkletree";

/*
// Public inputs
    root: pub Field,
    nullifier_hash: pub Field,
    _recipient: pub Field, // to prevent the proof exploit
    // Private inputs
    nullifier: Field,
    secret: Field,
    merkle_proof: [Field; 20],
    is_even: [bool; 20],
    */
async function generateProofs() {
  try {
    const args = process.argv.slice(2);
    const noir = new Noir(circuit as CompiledCircuit);
    const backend = new UltraHonkBackend(circuit.bytecode);
    const nullifier = args[0];
    const secret = args[1];
    const _recipient = args[2];
    const leaves = args.slice(3);
    const tree = await merkleTree(leaves);
    const commitment = await generateHash([
      Fr.fromString(nullifier),
      Fr.fromString(secret),
    ]);
    const merkle_proof = tree.proof(tree.getIndex(commitment));
    const nullifier_hash = await generateHash([Fr.fromString(nullifier)]);
    const inputs = {
      // Public inputs
      root: merkle_proof.root,
      nullifier_hash: nullifier_hash,
      _recipient,
      //Private inputs
      nullifier,
      secret,
      merkle_proof: merkle_proof.pathElements,
      is_even: merkle_proof.pathIndices.map((el) => el % 2 == 0),
    };
    const storeLog = console.log;
    console.log = () => {};
    const { witness } = await noir.execute(inputs);
    const { proof, publicInputs } = await backend.generateProof(witness, {
      keccak: true,
    });
    console.log = storeLog;
    const result = ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes", "bytes32[]"],
      [proof, publicInputs]
    );
    return result;
  } catch (error) {
    throw error;
  }
}

async function generateHash(input: Fr[]) {
  const bb = await Barretenberg.new();
  const hash = await bb.poseidon2Hash(input);
  return hash.toString();
}
const main = async () => {
  try {
    const proof = await generateProofs();
    process.stdout.write(proof);
    process.exit(0);
  } catch (error) {
    console.error("Error: ", error);
    process.exit(1);
  }
};

main();
