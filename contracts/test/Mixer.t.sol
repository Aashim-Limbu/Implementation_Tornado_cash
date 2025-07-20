// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 < 0.9.0;

import {Mixer, Poseidon2} from "../src/Mixer.sol";
import {Test, console} from "forge-std/Test.sol";
import {HonkVerifier} from "../src/Verifier.sol";
import {DeployMixer} from "../script/DeployMixer.s.sol";

contract MixerTest is Test {
    Mixer public mixer;
    HonkVerifier public verifier;
    Poseidon2 public hasher;
    address public recipient = makeAddr("recipient");
    uint32 public depth = 20;
    // Multiple users
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");

    // Recipients for withdrawals
    address public recipient1 = makeAddr("recipient1");
    address public recipient2 = makeAddr("recipient2");
    address public recipient3 = makeAddr("recipient3");

    function setUp() public {
        uint32 _depth = uint32(vm.envUint("MIXER_DEPTH"));
        console.log(_depth);
        DeployMixer deployer = new DeployMixer();
        (verifier, hasher, mixer) = deployer.deploy(_depth);

        vm.deal(alice, 1 ether);
        vm.deal(bob, 1 ether);
        vm.deal(charlie, 1 ether);
        // verifier = new HonkVerifier();
        // hasher = new Poseidon2();
        // mixer = new Mixer(depth, hasher, verifier);
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

    function testAnotherAddressSendProof() public {
        (bytes32 commitment, bytes32 nullifier, bytes32 secret) = _getCommitment();
        vm.expectEmit(true, false, false, true);
        emit Mixer.Deposited(commitment, 0, block.timestamp);
        mixer.deposit{value: mixer.DENOMINATION()}(commitment);
        bytes32[] memory leaves = new bytes32[](1);
        leaves[0] = commitment;
        (bytes memory proof, bytes32[] memory publicInputs) = _getProof(nullifier, secret, recipient, leaves);
        address attacker = makeAddr("Attacker");
        // make a withdrawal
        vm.prank(attacker);
        vm.expectRevert();
        mixer.withdraw(proof, publicInputs[0], publicInputs[1], payable(attacker));
    }

    // Multiple User
    function test_multipleDeposits() public {
        // Generate commitments for 3 users
        (bytes32 commitment1,,) = _getCommitment();
        (bytes32 commitment2,,) = _getCommitment();
        (bytes32 commitment3,,) = _getCommitment();

        console.log("=== DEPOSIT PHASE ===");

        // Alice deposits first
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit Mixer.Deposited(commitment1, 0, block.timestamp);
        mixer.deposit{value: mixer.DENOMINATION()}(commitment1);
        console.log("Alice deposited at index 0");

        // Bob deposits second
        vm.prank(bob);
        vm.expectEmit(true, false, false, true);
        emit Mixer.Deposited(commitment2, 1, block.timestamp);
        mixer.deposit{value: mixer.DENOMINATION()}(commitment2);
        console.log("Bob deposited at index 1");

        // Charlie deposits third
        vm.prank(charlie);
        vm.expectEmit(true, false, false, true);
        emit Mixer.Deposited(commitment3, 2, block.timestamp);
        mixer.deposit{value: mixer.DENOMINATION()}(commitment3);
        console.log("Charlie deposited at index 2");

        // Verify contract state
        assertEq(address(mixer).balance, 3 * mixer.DENOMINATION());
        assertEq(mixer.s_nextLeafIndex(), 3);

        console.log("Contract balance:", address(mixer).balance);
    }

    function test_firstUserWithdrawsAfterMultipleDeposits() public {
        // Generate commitments for 3 users
        (bytes32 commitment1, bytes32 nullifier1, bytes32 secret1) = _getCommitment();
        (bytes32 commitment2,,) = _getCommitment();
        (bytes32 commitment3,,) = _getCommitment();

        console.log("=== SEQUENTIAL DEPOSITS ===");

        // All users deposit
        vm.prank(alice);
        mixer.deposit{value: mixer.DENOMINATION()}(commitment1);
        console.log("Alice deposited commitment1");

        vm.prank(bob);
        mixer.deposit{value: mixer.DENOMINATION()}(commitment2);
        console.log("Bob deposited commitment2");

        vm.prank(charlie);
        mixer.deposit{value: mixer.DENOMINATION()}(commitment3);
        console.log("Charlie deposited commitment3");

        console.log("=== WITHDRAWAL PHASE ===");

        // Alice (first depositor) wants to withdraw
        // She needs ALL leaves that were used to compute the current root
        bytes32[] memory allLeaves = new bytes32[](3);
        allLeaves[0] = commitment1; // Alice's commitment
        allLeaves[1] = commitment2; // Bob's commitment
        allLeaves[2] = commitment3; // Charlie's commitment

        (bytes memory proof, bytes32[] memory publicInputs) = _getProof(nullifier1, secret1, recipient1, allLeaves);

        // Verify proof is valid
        bool isValid = verifier.verify(proof, publicInputs);
        assertTrue(isValid, "Proof should be valid");

        uint256 recipientInitialBalance = recipient1.balance;

        // Alice withdraws
        mixer.withdraw(proof, publicInputs[0], publicInputs[1], payable(recipient1));

        // Verify withdrawal
        assertEq(recipient1.balance, recipientInitialBalance + mixer.DENOMINATION());
        assertEq(address(mixer).balance, 2 * mixer.DENOMINATION());
        assertTrue(mixer.s_nullifierHashes(publicInputs[1]), "Nullifier should be marked as used");

        console.log("Alice successfully withdrew");
        console.log("Remaining contract balance:", address(mixer).balance);
    }

    function test_multipleWithdrawalsInDifferentOrder() public {
        // Generate commitments for 3 users
        (bytes32 commitment1, bytes32 nullifier1, bytes32 secret1) = _getCommitment();
        (bytes32 commitment2, bytes32 nullifier2, bytes32 secret2) = _getCommitment();
        (bytes32 commitment3, bytes32 nullifier3, bytes32 secret3) = _getCommitment();

        // All users deposit
        vm.prank(alice);
        mixer.deposit{value: mixer.DENOMINATION()}(commitment1);

        vm.prank(bob);
        mixer.deposit{value: mixer.DENOMINATION()}(commitment2);

        vm.prank(charlie);
        mixer.deposit{value: mixer.DENOMINATION()}(commitment3);

        bytes32[] memory allLeaves = new bytes32[](3);
        allLeaves[0] = commitment1;
        allLeaves[1] = commitment2;
        allLeaves[2] = commitment3;

        console.log("=== WITHDRAWAL PHASE (Charlie first) ===");

        // Charlie withdraws first (even though he deposited last)
        (bytes memory proof3, bytes32[] memory publicInputs3) = _getProof(nullifier3, secret3, recipient3, allLeaves);
        mixer.withdraw(proof3, publicInputs3[0], publicInputs3[1], payable(recipient3));

        assertEq(recipient3.balance, mixer.DENOMINATION());
        assertEq(address(mixer).balance, 2 * mixer.DENOMINATION());
        assertTrue(mixer.s_nullifierHashes(publicInputs3[1]));

        console.log("Charlie withdrew first");

        // Bob withdraws second
        (bytes memory proof2, bytes32[] memory publicInputs2) = _getProof(nullifier2, secret2, recipient2, allLeaves);
        mixer.withdraw(proof2, publicInputs2[0], publicInputs2[1], payable(recipient2));

        assertEq(recipient2.balance, mixer.DENOMINATION());
        assertEq(address(mixer).balance, 1 * mixer.DENOMINATION());
        assertTrue(mixer.s_nullifierHashes(publicInputs2[1]));

        console.log("Bob withdrew second");

        // Alice withdraws last
        (bytes memory proof1, bytes32[] memory publicInputs1) = _getProof(nullifier1, secret1, recipient1, allLeaves);
        mixer.withdraw(proof1, publicInputs1[0], publicInputs1[1], payable(recipient1));

        assertEq(recipient1.balance, mixer.DENOMINATION());
        assertEq(address(mixer).balance, 0);
        assertTrue(mixer.s_nullifierHashes(publicInputs1[1]));

        console.log("Alice withdrew last");
        console.log("All withdrawals complete, contract balance:", address(mixer).balance);
    }

    function test_withdrawalWithOutdatedLeafSet() public {
        (bytes32 commitment1, bytes32 nullifier1, bytes32 secret1) = _getCommitment();
        (bytes32 commitment2,,) = _getCommitment();

        // Alice deposits
        vm.prank(alice);
        mixer.deposit{value: mixer.DENOMINATION()}(commitment1);

        // At this point, Alice could withdraw with just her commitment
        bytes32[] memory singleLeaf = new bytes32[](1);
        singleLeaf[0] = commitment1;

        // But then Bob deposits, changing the root
        vm.prank(bob);
        mixer.deposit{value: mixer.DENOMINATION()}(commitment2);

        // Now Alice tries to withdraw with the old leaf set (just her commitment)
        (bytes memory proof, bytes32[] memory publicInputs) = _getProof(nullifier1, secret1, recipient1, singleLeaf);

        mixer.withdraw(proof, publicInputs[0], publicInputs[1], payable(recipient1));
        assertEq(recipient1.balance, mixer.DENOMINATION());
        console.log("Withdrawal with outdated leaf set correctly failed");
    }
    // Test: Double spending prevention

    function test_doubleSpendingPrevention() public {
        (bytes32 commitment1, bytes32 nullifier1, bytes32 secret1) = _getCommitment();

        // Alice deposits
        vm.prank(alice);
        mixer.deposit{value: mixer.DENOMINATION()}(commitment1);

        bytes32[] memory leaves = new bytes32[](1);
        leaves[0] = commitment1;

        // Alice withdraws successfully
        (bytes memory proof, bytes32[] memory publicInputs) = _getProof(nullifier1, secret1, recipient1, leaves);
        mixer.withdraw(proof, publicInputs[0], publicInputs[1], payable(recipient1));

        assertEq(recipient1.balance, mixer.DENOMINATION());

        // Alice tries to withdraw again with the same nullifier
        vm.expectRevert(abi.encodeWithSelector(Mixer.Mixer__NullifierAlreadyUsed.selector, publicInputs[1]));
        mixer.withdraw(proof, publicInputs[0], publicInputs[1], payable(recipient1));

        console.log("Double spending correctly prevented");
    }
    // Test: Large number of deposits and withdrawals

    function test_scalabilityWithManyUsers() public {
        uint256 numUsers = 5;
        bytes32[] memory commitments = new bytes32[](numUsers);
        bytes32[] memory nullifiers = new bytes32[](numUsers);
        bytes32[] memory secrets = new bytes32[](numUsers);
        address[] memory users = new address[](numUsers);
        address[] memory recipients = new address[](numUsers);

        // Generate users and commitments
        for (uint256 i = 0; i < numUsers; i++) {
            users[i] = makeAddr(string(abi.encodePacked("user", i)));
            recipients[i] = makeAddr(string(abi.encodePacked("recipient", i)));
            vm.deal(users[i], 1 ether);

            (commitments[i], nullifiers[i], secrets[i]) = _getCommitment();
        }

        console.log("=== MASS DEPOSIT PHASE ===");

        // All users deposit
        for (uint256 i = 0; i < numUsers; i++) {
            vm.prank(users[i]);
            mixer.deposit{value: mixer.DENOMINATION()}(commitments[i]);
            console.log("User", i, "deposited");
        }

        assertEq(address(mixer).balance, numUsers * mixer.DENOMINATION());
        assertEq(mixer.s_nextLeafIndex(), numUsers);

        console.log("=== MASS WITHDRAWAL PHASE ===");

        // All users withdraw (reverse order)
        for (uint256 i = numUsers; i > 0; i--) {
            uint256 idx = i - 1;
            (bytes memory proof, bytes32[] memory publicInputs) =
                _getProof(nullifiers[idx], secrets[idx], recipients[idx], commitments);

            mixer.withdraw(proof, publicInputs[0], publicInputs[1], payable(recipients[idx]));
            assertEq(recipients[idx].balance, mixer.DENOMINATION());
            console.log("User", idx, "withdrew");
        }

        assertEq(address(mixer).balance, 0);
        console.log("All", numUsers, "users successfully deposited and withdrew");
    }
}
