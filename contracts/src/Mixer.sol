// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Mixer {
    mapping(bytes32 commitment => bool isUsed) public s_commitments;

    error Mixer__CommitmentAlreadyAdded(bytes32);
    error Mixer__DepositAmountNotCorrect(uint256 deposited, uint256 expectedAmount);

    uint256 public constant DENOMINATION = 0.001 ether;

    constructor(uint256 _denomination) {}
    /**
     * @notice Deposit Fund to mixer
     * @param _commitment the poseiden commitment of the nullifier and secret (generated off-chain).
     */

    function deposit(bytes32 _commitment) external payable {
        // 1. Check if the commitment is already been used.
        if (s_commitments[_commitment]) {
            revert Mixer__CommitmentAlreadyAdded(_commitment);
        }
        if (msg.value != DENOMINATION) {
            revert Mixer__DepositAmountNotCorrect(msg.value, DENOMINATION);
        }
        // 2. Allow user to send ETH and make sure it is of the correct fixed amount which is (0.001 ETH) (denomination).
        // 3. Add the commitment to a data structure containing all of the commitments.
        s_commitments[_commitment] = true;
    }
    /**
     * @notice Withdraw funds from the mixer in a private way.
     * @param _proof The proof that the user has the right to withdraw (they know a valid commitment).
     */

    function withdraw(bytes calldata _proof) external {
        // Check the _proof with some Verifier contract
        // Check the nullifier has not been used to prevent the double spending.
        // Send them the funds.
    }
}
