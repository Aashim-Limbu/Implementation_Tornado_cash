use poseidon::poseidon2;
pub fn compute_merkle_root(leaf: Field, merkle_proof: [Field; 20], is_even: [bool; 20]) -> Field {
    let mut hash = leaf;
    for i in 0..20 {
        let (left, right) = if is_even[i] {
            (hash, merkle_proof[i])
        } else {
            (merkle_proof[i], hash)
        };
        hash = poseidon2::Poseidon2::hash([left, right], 2);
    }
    // return the root of the Merkle tree
    hash
}
