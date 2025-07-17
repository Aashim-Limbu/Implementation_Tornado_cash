import {
  BaseError,
  ChainNotFoundError,
  ContractFunctionRevertedError,
  InsufficientFundsError,
  TransactionRejectedRpcError,
} from "viem";

export type ErrorType =
  | "pdf-parse"
  | "proof-generation"
  | "simulation"
  | "transaction"
  | "validation"
  | "network"
  | "unknown";
export interface ErrorState {
  message: string;
  type: ErrorType;
  details?: string;
  errorName?: string;
}
export const parseContractError = (
  error: unknown,
  isSimulation = false
): ErrorState => {
  console.log("Aashim Error: ", error);

  const prefix = isSimulation ? "Simulation failed: " : "";

  if (error instanceof BaseError) {
    const revertError = error.walk(
      (err) => err instanceof ContractFunctionRevertedError
    );
    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName ?? "";

      switch (errorName) {
        case "Mixer__UnknownRoot":
          return {
            message: `${prefix}Invalid merkle root`,
            type: isSimulation ? "simulation" : "validation",
            details:
              "The merkle root used in your proof doesn't match the current tree state. The proof may be outdated.",
            errorName,
          };

        case "Mixer__NullifierAlreadyUsed":
          return {
            message: `${prefix}This deposit has already been withdrawn`,
            type: isSimulation ? "simulation" : "validation",
            details:
              "The nullifier hash has been used before. Each deposit can only be withdrawn once.",
            errorName,
          };

        case "Mixer__InvalidProof":
          return {
            message: `${prefix}Invalid zero-knowledge proof`,
            type: isSimulation ? "simulation" : "validation",
            details:
              "The proof verification failed. Please regenerate your proof.",
            errorName,
          };

        case "Mixer__WithdrawFailed":
          return {
            message: `${prefix}Withdrawal transaction failed`,
            type: isSimulation ? "simulation" : "transaction",
            details:
              "The contract couldn't send funds to the recipient address.",
            errorName,
          };

        case "Mixer__CommitmentAlreadyAdded":
          return {
            message: `${prefix}Commitment already exists`,
            type: isSimulation ? "simulation" : "validation",
            details: "This commitment has already been added to the tree.",
            errorName,
          };

        case "Mixer__DepositAmountNotCorrect":
          return {
            message: `${prefix}Incorrect deposit amount`,
            type: isSimulation ? "simulation" : "validation",
            details: "The deposit amount doesn't match the expected amount.",
            errorName,
          };

        case "IncrementalMerkleTree__LevelOurOfBounds":
          return {
            message: `${prefix}Merkle tree level out of bounds`,
            type: isSimulation ? "simulation" : "validation",
            details: "The merkle tree level is invalid.",
            errorName,
          };

        case "IncrementalMerkleTree__MerkleTreeFull":
          return {
            message: `${prefix}Merkle tree is full`,
            type: isSimulation ? "simulation" : "validation",
            details: "The merkle tree has reached its maximum capacity.",
            errorName,
          };

        case "IncrementalMerkleTree__ShouldBeGreaterThanZero":
          return {
            message: `${prefix}Value should be greater than zero`,
            type: isSimulation ? "simulation" : "validation",
            details: "A parameter value must be greater than zero.",
            errorName,
          };

        case "IncrementalMerkleTree__ShouldBeLessThan32":
          return {
            message: `${prefix}Value should be less than 32`,
            type: isSimulation ? "simulation" : "validation",
            details: "A parameter value must be less than 32.",
            errorName,
          };

        case "ReentrancyGuardReentrantCall":
          return {
            message: `${prefix}Reentrancy detected`,
            type: isSimulation ? "simulation" : "validation",
            details: "The contract detected a reentrant call.",
            errorName,
          };

        default:
          return {
            message: `${prefix}Contract error: ${errorName}`,
            type: isSimulation ? "simulation" : "validation",
            details: "An unknown contract error occurred.",
            errorName,
          };
      }
    }
  }

  // Check for common wallet/network errors
  else if (error instanceof TransactionRejectedRpcError) {
    return {
      message: "Transaction was rejected by user",
      type: "transaction",
      details: "You cancelled the transaction in your wallet.",
    };
  } else if (error instanceof InsufficientFundsError) {
    return {
      message: "Insufficient funds for gas fees",
      type: "transaction",
      details: "You don't have enough ETH to pay for transaction fees.",
    };
  } else if (error instanceof ChainNotFoundError) {
    return {
      message: "Chain not Found",
      type: "transaction",
      details: error.details,
    };
  }

  // Default fallback
  return {
    message: isSimulation
      ? "Simulation failed with unknown error"
      : "An unexpected error occurred",
    type: "unknown",
    details: `Error: ${error}`,
  };
};
