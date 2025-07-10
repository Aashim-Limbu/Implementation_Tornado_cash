// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/**
 * @title Tornado Cash Zk Implementation.
 * @author Aashim Limbu
 * @notice This is the contract for 0.001 ETH . Each amount will have a separate contract.
 */
import {IncrementalMerkleTree} from "./IncrementalMerkleTree.sol";
import {Poseidon2} from "@poseidon2/contracts/Poseidon2.sol";
import {IVerifier} from "./Verifier.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Mixer is IncrementalMerkleTree, ReentrancyGuard {
    mapping(bytes32 commitment => bool isUsed) public s_commitments;
    mapping(bytes32 nullifier => bool isUsed) public s_nullifierHashes;
    IVerifier public immutable i_verifier;

    event Deposited(bytes32 indexed _commitments, uint32 nextIndex, uint256 timestamp);
    event Withdrawl(address indexed recipient, bytes32 _nullifierHash);

    error Mixer__CommitmentAlreadyAdded(bytes32);
    error Mixer__DepositAmountNotCorrect(uint256 deposited, uint256 expectedAmount);
    error Mixer__UnknownRoot(bytes32 root);
    error Mixer__NullifierAlreadyUsed(bytes32 _nullifierHash);
    error Mixer__InvalidProof();
    error Mixer__WithdrawFailed(address, uint256);

    uint256 public constant DENOMINATION = 0.001 ether;

    constructor(uint32 _depth, Poseidon2 _hasher, IVerifier _verifier) IncrementalMerkleTree(_depth, _hasher) {
        i_verifier = _verifier;
    }
    /**
     * @notice Deposit Fund to mixer
     * @param _commitment the poseiden commitment of the nullifier and secret (generated off-chain).
     */

    function deposit(bytes32 _commitment) external payable nonReentrant{
        // 1. Check if the commitment is already been used.
        if (s_commitments[_commitment]) {
            revert Mixer__CommitmentAlreadyAdded(_commitment);
        }
        if (msg.value != DENOMINATION) {
            revert Mixer__DepositAmountNotCorrect(msg.value, DENOMINATION);
        }
        // 2. Allow user to send ETH and make sure it is of the correct fixed amount which is (0.001 ETH) (denomination).
        // 3. Add the commitment to a data structure containing all of the commitments.
        // 4. Insert the commitment into the merkle tree and emit an event with the index of the commitment.
        uint32 insertedIndex = _insert(_commitment);
        s_commitments[_commitment] = true;
        // we need to compute the merkle tree off chain to generate proofs. Thus we can't query the mappings we emmit them in event. [Compute entire merkle tree off chain]
        emit Deposited(_commitment, insertedIndex, block.timestamp);
    }
    /**
     * @notice Withdraw funds from the mixer.
     * @param _proof the zk proof generated off-chain.
     * @param _root the root of the merkle tree that was used to generate the proof.
     * @param _nullifierHash the nullifier hash that was used to generate the proof.
     * @param _recipient the address that will receive the funds.
     */

    function withdraw(bytes calldata _proof, bytes32 _root, bytes32 _nullifierHash, address payable _recipient)
        external nonReentrant
    {
        // Check that the root that was used in the proof matches the root on-chain.
        if (!_isKnownRoot(_root)) {
            revert Mixer__UnknownRoot(_root);
        }
        if (s_nullifierHashes[_nullifierHash]) {
            revert Mixer__NullifierAlreadyUsed(_nullifierHash);
        }
        bytes32[] memory publicInputs = new bytes32[](3);
        publicInputs[0] = _root;
        publicInputs[1] = _nullifierHash;
        publicInputs[2] = bytes32(uint256(uint160(address(_recipient))));

        // Check the nullifier has not been used to prevent the double spending.
        // Check the _proof with some Verifier contract
        bool isValid = i_verifier.verify(_proof, publicInputs);
        if (!isValid) {
            revert Mixer__InvalidProof();
        }
        s_nullifierHashes[_nullifierHash] = true;
        // Send them the funds.
        (bool success,) = _recipient.call{value: DENOMINATION}("");
        if (!success) {
            revert Mixer__WithdrawFailed(_recipient, DENOMINATION);
        }
        emit Withdrawl(_recipient, _nullifierHash);
    }
}
