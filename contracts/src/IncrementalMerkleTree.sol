// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0 < 0.9.0;

import {Poseidon2, Field} from "@poseidon2/contracts/Poseidon2.sol";

contract IncrementalMerkleTree {
    mapping(uint256 depth => bytes32 subtreeHash) public s_cachedSubtree;
    mapping(uint256 _index => bytes32 rootHash) public s_roots;
    uint32 public s_currentRootIndex;
    uint32 public constant ROOT_HISTORY_SIZE = 30;

    uint32 public immutable i_depth;
    uint32 public s_nextLeafIndex;
    Poseidon2 public immutable i_hasher;

    error IncrementalMerkleTree__ShouldBeGreaterThanZero();
    error IncrementalMerkleTree__ShouldBeLessThan32();
    error IncrementalMerkleTree__LevelOurOfBounds();
    error IncrementalMerkleTree__MerkleTreeFull(uint256);

    constructor(uint32 _depth, Poseidon2 _hasherContract) {
        if (_depth == 0) {
            revert IncrementalMerkleTree__ShouldBeGreaterThanZero();
        } else if (_depth >= 32) {
            revert IncrementalMerkleTree__ShouldBeLessThan32();
        }
        i_depth = _depth;
        i_hasher = _hasherContract;
        // Initialize the tree with zeros (precomputed for all zero subtrees.) (since poseidon2 value number is less than uint256 so need to perform modulus operation with poseidon2 max number)
        // Store the initial root in storage.
        s_roots[0] = zeros(_depth); // store the ID 0 root as the depth 0,zero tree.
    }

    // The tree size will always be for depth level n =>  the number of leaf would be 2^n;
    /**
     * @notice Insert a leaf into the incremental merkle tree.
     * @param _leaf the leaf to insert.
     * @return nextIndex the index of the leaf that was inserted.
     */
    function _insert(bytes32 _leaf) internal returns (uint32 nextIndex) {
        // add the leaf to incremental merkle tree.
        uint32 _nextleafIndex = s_nextLeafIndex;
        // check that the index of leaf being added is within th maximum index 2**n.
        if (_nextleafIndex == uint32(2) ** i_depth) {
            revert IncrementalMerkleTree__MerkleTreeFull(_nextleafIndex);
        }
        uint32 currentIndex = s_nextLeafIndex;
        bytes32 currentHash = _leaf;
        bytes32 left;
        bytes32 right;
        // figure out if the index is even.
        // - if even we need to put it on the left of the hash and a zero tree on the right => store result as a cached subtree.
        // - if odd, we need the leaf to be on right and a cached subtree on the left.
        for (uint32 i = 0; i < i_depth; i++) {
            if (currentIndex % 2 == 0) {
                left = currentHash;
                right = zeros(i);
                s_cachedSubtree[i] = currentHash; // which is anyway the left part
            } else {
                left = s_cachedSubtree[i];
                right = currentHash;
            }
            // Hash => hash(left,riight)
            currentHash = Field.toBytes32(i_hasher.hash_2(Field.toField(left), Field.toField(right)));
            // update the current index.
            currentIndex = currentIndex / 2;
        }
        // store the root in storage
        uint32 newRootIndex = (s_currentRootIndex + 1) % ROOT_HISTORY_SIZE;
        s_currentRootIndex = newRootIndex;
        s_roots[newRootIndex] = currentHash;
        // increment next leaf index
        s_nextLeafIndex = _nextleafIndex + 1;
        return _nextleafIndex;
    }
    /**
     * @notice Check if the root is known in the history of roots.
     * @param _root the root to check.
     * @return true if the root is known, false otherwise.
     */

    function _isKnownRoot(bytes32 _root) internal view returns (bool) {
        if (_root == 0) {
            // since anyother root during the initialization is s_root = 0. It prevents that .
            return false;
        }
        uint32 _currentRootIndex = s_currentRootIndex;
        uint32 i = _currentRootIndex;
        do {
            if (_root == s_roots[i]) {
                return true;
            }
            if (i == 0) {
                i = ROOT_HISTORY_SIZE - 1;
            }
            i--;
        } while (i != _currentRootIndex);
        return false;
    }
    // we don't calculate the zero subtree on-chain we use them given the data from off-chain
    // we do some keccak("string") which is bytes32 , but poseidon2 hash function uses Field type data so maximum size of Field is less than the maximum size of o/p of keccak256 hash
    // so we do modulus operation keccak256("aashim") % Field.Prime = 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001
    // cast --to-dec 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001
    // bytes32(uint256(keccak256("aashim"))%21888242871839275222246405745257275088548364400416034343698204186575808495617)

    function zeros(uint32 i) public pure returns (bytes32) {
        if (i == 0) return bytes32(0x1f9c815bb3f29ba2fc3f19b72e48938aed2707689809bde3eccc309ba32fe917);
        else if (i == 1) return bytes32(0x26826ad1a5d1795f583284d34418d3bac2b6b2515b16a2a432cf6aa3b6443ba9);
        else if (i == 2) return bytes32(0x0ed66b54d8bfb40fdba0c49e7636f8850388fcf57e53635e8f4f6be09ca832bf);
        else if (i == 3) return bytes32(0x136ec4fdcd944b309c96af02b3354288305d45c3924a380b7d740456a310c007);
        else if (i == 4) return bytes32(0x05357e9c92cdcb2f8f3d6d0b559644dbdc71a64287bd05ced0ffaea1f288b0f8);
        else if (i == 5) return bytes32(0x0b05826301fec5aeaceacb22a23a4a98a425d1c06999b65178ddf31fdfca6f4f);
        else if (i == 6) return bytes32(0x032e018fb302306660b0232159cd85aaedf00603f01cc9ad3eaaf999e1eb24b4);
        else if (i == 7) return bytes32(0x0a53ee2c5d3fd7df8e86812175d3edd683322886dcbc46c91aaf314f554e42f0);
        else if (i == 8) return bytes32(0x074307f10fc9aef3542720f00022e889a43df04f2d68b67fb617d5bd97c690bf);
        else if (i == 9) return bytes32(0x15e905d2b53b0b5b1ea7036712ab3ae8de48a8777a89210e721ce7df6476b82d);
        else if (i == 10) return bytes32(0x1faa8b22a213e896a362fe6792266534158a96e72df5c91a44d0a17edf426076);
        else if (i == 11) return bytes32(0x21928b321d687fd22fc795f16320f2179fe0fe2618814cfec48503bb0876c2d3);
        else if (i == 12) return bytes32(0x082656ecc9dcee31e3af4592a883b742bad86cf9479d03665ed4cd9b00bbc2fc);
        else if (i == 13) return bytes32(0x13107442c825ccf2e2a47d5ddbb774ef34ce723910b966811bc9a37e33606014);
        else if (i == 14) return bytes32(0x1b9ed5a57b907fb0561a542285f3566fcc869e454095c21d347f792658258874);
        else if (i == 15) return bytes32(0x2b21b8073fc3f0e2a160089adbb7c1cb1929cf27349214d91cd37145f4359560);
        else if (i == 16) return bytes32(0x1c30725611326f7e7ba8a6631b6a1a695fa306cdff7899ab7bb8ca33cf03903b);
        else if (i == 17) return bytes32(0x143eb6a2e7258d9caeb2106cfbb42601aae181d10a45440b79efea33740b9b8b);
        else if (i == 18) return bytes32(0x12a94855d8452529bf15797b895208c79705306bf4e46752ab82fc22b4eb3013);
        else if (i == 19) return bytes32(0x261149ed42d50ddedc2d2a6b129194b6b30bb008cf811a03a35b5af656c533a2);
        else if (i == 20) return bytes32(0x18ba2a3d100f8d229bf493d4343c5f91328376d1213b83f1e1f60a19298f2753);
        else if (i == 21) return bytes32(0x2f3726e17ceee6f2619e3bfaf38e057c4a41a13f4055f8afceb2be9dd3482a72);
        else if (i == 22) return bytes32(0x2e62289432f7c87513dff45708663f17458cdbe6d38663d490edaf166de8718a);
        else if (i == 23) return bytes32(0x024bbee17c36536426668e3d38cb241cd4a71293fb09a4791daa7a7f81257270);
        else if (i == 24) return bytes32(0x05129f540c9fe97a0fbb7f853c6bf631e0b2686dc5bc6cb655431a691c0d67f4);
        else if (i == 25) return bytes32(0x2cb45db6b3576ff05350489c6e66ec846c24a9c094a7517a1c662333f6e0c97d);
        else if (i == 26) return bytes32(0x045f46e8d91019ca1f8b4190a11bdbf0bfe713aeae3c6f57ecd61398af1bb0f3);
        else if (i == 27) return bytes32(0x080fec49ae68b361c26ae04c04714e953133c488e30ce9d1cd556b5856755e0d);
        else if (i == 28) return bytes32(0x188ee810bc82188b269fd839485603db1fb6da58eade0a6e0300ec0640dbc68b);
        else if (i == 29) return bytes32(0x2e3896219cbba83832caf3df6fe2e757311e0839667d0f8dca09c2c65d8b6c1a);
        else if (i == 30) return bytes32(0x1dfa01f5f8e561862c6eb258cbcb80ab5824016ed37fd7c326bc80e63b31aefc);
        else if (i == 31) return bytes32(0x0235eaffd7f108376658bad7b8c37ae3e9dd59215e0e8d98549ac63d6dab54de);
        else revert IncrementalMerkleTree__LevelOurOfBounds();
    }
}
