use poseidon::poseidon2;
mod merkle_tree;
fn main(
    // Public inputs
    root: pub Field,
    nullifier_hash: pub Field,
    _recipient: pub Field, // to prevent the proof exploit
    // Private inputs
    nullifier: Field,
    secret: Field,
    merkle_proof: [Field; 20],
    is_even: [bool; 20],
) {
    // compute commitment Poseidon(nullifier,secret)
    let commitment = poseidon2::Poseidon2::hash([nullifier, secret], 2);
    // check the nullifier with nullifier hash
    let computed_nullifier_hash = poseidon2::Poseidon2::hash([nullifier], 1);
    assert(computed_nullifier_hash == nullifier_hash);

    // check if the commitment is in the Merkle tree.
    let computed_root = merkle_tree::compute_merkle_root(commitment, merkle_proof, is_even);
    assert_eq(computed_root, root);
}
