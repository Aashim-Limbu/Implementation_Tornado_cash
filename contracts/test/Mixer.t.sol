// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 < 0.9.0;

import {Mixer, Poseidon2} from "../src/Mixer.sol";
import {Test, console} from "forge-std/Test.sol";
import {HonkVerifier} from "../src/Verifier.sol";

contract MixerTest is Test {
    Mixer public mixer;
    HonkVerifier public verifier;
    Poseidon2 public hasher;
    address public recipient = makeAddr("recipient");
    uint32 public depth = 20;

    function setUp() public {
        verifier = new HonkVerifier();
        hasher = new Poseidon2();
        mixer = new Mixer(depth, hasher, verifier);
    }

    function _getCommitment() public returns (bytes32 commitment, bytes32 nullifier, bytes32 secret) {
        string[] memory script = new string[](2);
        script[0] = "ts-node";
        script[1] = "./external-scripts/generateCommitment.ts";
        // Runs the script
        bytes memory result = vm.ffi(script);
        // abi.decode the results
        (commitment, nullifier, secret) = abi.decode(result, (bytes32, bytes32, bytes32));
    }

    function test_make_deposit() public {
        // 1. Create a commitment.
        (bytes32 commitment,,) = _getCommitment();
        // 2. Make a deposit.
        // event Deposited(bytes32 indexed _commitments, uint32 nextIndex, uint256 timestamp);
        vm.expectEmit(true, false, false, true);
        emit Mixer.Deposited(commitment, 0, block.timestamp);
        mixer.deposit{value: mixer.DENOMINATION()}(commitment);
    }

    function _getProof(bytes32 _nullifier, bytes32 _secret, address _recipient, bytes32[] memory leaves)
        internal
        returns (bytes memory proof, bytes32[] memory publicInputs)
    {
        string[] memory inputs = new string[](leaves.length + 5);
        inputs[0] = "ts-node";
        inputs[1] = "./external-scripts/generateProofs.ts";
        inputs[2] = vm.toString(_nullifier);
        inputs[3] = vm.toString(_secret);
        inputs[4] = vm.toString(bytes32(uint256(uint160(_recipient))));

        for (uint32 i = 0; i < leaves.length; i++) {
            inputs[5 + i] = vm.toString(leaves[i]);
        }
        bytes memory result = vm.ffi(inputs);
        // decode the result to get the proof
        (proof, publicInputs) = abi.decode(result, (bytes, bytes32[]));
    }

    function test_make_withdrawal() public {
        // 1. Create a commitment.
        (bytes32 commitment, bytes32 nullifier, bytes32 secret) = _getCommitment();
        // 2. Make a deposit.
        // event Deposited(bytes32 indexed _commitments, uint32 nextIndex, uint256 timestamp);
        vm.expectEmit(true, false, false, true);
        emit Mixer.Deposited(commitment, 0, block.timestamp);
        mixer.deposit{value: mixer.DENOMINATION()}(commitment);
        // create a proof
        // Generally all the leaves are all fetched from the emitted events.
        bytes32[] memory leaves = new bytes32[](1);
        leaves[0] = commitment;
        (bytes memory proof, bytes32[] memory publicInputs) = _getProof(nullifier, secret, recipient, leaves);
        bool isValid = verifier.verify(proof, publicInputs);
        assertTrue(isValid);
        uint256 recipient_initial_balance = recipient.balance;
        assertEq(recipient_initial_balance, 0);
        assertEq(address(mixer).balance, mixer.DENOMINATION());
        // make a withdrawal
        mixer.withdraw(proof, publicInputs[0], publicInputs[1], payable(address(uint160(uint256(publicInputs[2])))));
        assertEq(recipient.balance, mixer.DENOMINATION());
        assertEq(address(mixer).balance, 0);
    }
}
