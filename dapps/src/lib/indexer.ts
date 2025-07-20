import { JsonRpcProvider, Contract } from "ethers";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
const provider = new JsonRpcProvider(RPC_URL);
const ABI = [
  "event Deposited(bytes32 indexed _commitments, uint32 nextIndex, uint256 timestamp)",
];

interface DepositEvent {
  commitment: string;
  index: number;
  timestamp: string;
  txHash: string;
  blockNumber: number;
}

const FROM_BLOCK = 8625793;
export async function fetchLeaves(
  contractAddress: string,
  fromBlock = 0 | FROM_BLOCK,
  toBlock: number | string = "latest"
): Promise<DepositEvent[]> {
  const contract = new Contract(contractAddress, ABI, provider);
  try {
    const filter = contract.filters.Deposited();
    const events = await contract.queryFilter(filter, fromBlock, toBlock);

    const deposits: DepositEvent[] = [];

    for (const event of events) {
      if ("args" in event && event.args) {
        try {
          const deposit: DepositEvent = {
            commitment: event.args._commitments as string,
            index: Number(event.args.nextIndex),
            timestamp: event.args.timestamp.toString(),
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
          };
          deposits.push(deposit);
        } catch (error) {
          console.warn("Error processing event:", error, event);
        }
      }
    }

    return deposits;
  } catch (error) {
    console.error("Error fetching leaves:", error);
    throw new Error(`Failed to fetch deposit events: ${error}`);
  }
}
