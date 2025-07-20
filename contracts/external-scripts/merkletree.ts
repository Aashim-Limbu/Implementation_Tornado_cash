import { Barretenberg, Fr } from "@aztec/bb.js";

// Hashes two values using Poseidon2
async function hashLeftRight(left: string, right: string): Promise<string> {
  const bb = await Barretenberg.new();
  const frLeft = Fr.fromString(left);
  const frRight = Fr.fromString(right);
  const hash = await bb.poseidon2Hash([frLeft, frRight]);
  return hash.toString();
}

interface Proof {
  root: string;
  pathElements: string[];
  pathIndices: number[];
  leaf: string;
}

// Represents a Merkle tree using Poseidon2 hashing
export class PoseidonTree {
  private levels: number;
  private hashLeftRight: (left: string, right: string) => Promise<string>;
  private storage: Map<string, string>;
  private zeros: string[];
  private totalLeaves: number;

  constructor(levels: number, zeros: string[]) {
    if (zeros.length < levels + 1) {
      throw new Error(
        "Not enough zero values provided for the given tree height."
      );
    }
    this.levels = levels;
    this.hashLeftRight = hashLeftRight;
    this.storage = new Map();
    this.zeros = zeros;
    this.totalLeaves = 0;
  }

  // Initializes tree with default leaves
  async init(defaultLeaves: string[] = []): Promise<void> {
    if (defaultLeaves.length > 0) {
      this.totalLeaves = defaultLeaves.length;

      // Store leaves at level 0
      defaultLeaves.forEach((leaf, index) => {
        this.storage.set(PoseidonTree.indexToKey(0, index), leaf);
      });

      // Build intermediate nodes bottom-up
      for (let level = 1; level <= this.levels; level++) {
        const numNodes = Math.ceil(this.totalLeaves / 2 ** level);
        for (let i = 0; i < numNodes; i++) {
          const leftKey = PoseidonTree.indexToKey(level - 1, 2 * i);
          const rightKey = PoseidonTree.indexToKey(level - 1, 2 * i + 1);
          const left = this.storage.get(leftKey) || this.zeros[level - 1];
          const right = this.storage.get(rightKey) || this.zeros[level - 1];
          const node = await this.hashLeftRight(left, right);
          this.storage.set(PoseidonTree.indexToKey(level, i), node);
        }
      }
    }
  }

  // Generates storage key from position
  private static indexToKey(level: number, index: number): string {
    return `${level}-${index}`;
  }

  // Finds index of a leaf value
  getIndex(leaf: string): number {
    for (const [key, value] of this.storage.entries()) {
      if (value === leaf && key.startsWith("0-")) {
        return parseInt(key.split("-")[1]);
      }
    }
    return -1;
  }

  // Returns root hash of the tree
  root(): string {
    return (
      this.storage.get(PoseidonTree.indexToKey(this.levels, 0)) ||
      this.zeros[this.levels]
    );
  }

  // Generates Merkle proof for a leaf
  proof(index: number): Proof {
    const leaf = this.storage.get(PoseidonTree.indexToKey(0, index));
    if (!leaf) throw new Error("leaf not found");

    const pathElements: string[] = [];
    const pathIndices: number[] = [];

    this.traverse(index, (level, currentIndex, siblingIndex) => {
      const sibling =
        this.storage.get(PoseidonTree.indexToKey(level, siblingIndex)) ||
        this.zeros[level];
      pathElements.push(sibling);
      pathIndices.push(currentIndex % 2);
    });

    return { root: this.root(), pathElements, pathIndices, leaf };
  }

  // Appends new leaf to the tree
  async insert(leaf: string): Promise<void> {
    const index = this.totalLeaves;
    await this.update(index, leaf, true);
    this.totalLeaves++;
  }

  // Updates existing leaf or inserts new one
  async update(
    index: number,
    newLeaf: string,
    isInsert: boolean = false
  ): Promise<void> {
    if (!isInsert && index >= this.totalLeaves) {
      throw Error("Use insert method for new elements.");
    } else if (isInsert && index < this.totalLeaves) {
      throw Error("Use update method for existing elements.");
    }

    const keyValueToStore: { key: string; value: string }[] = [];
    let currentElement = newLeaf;

    // Update path from leaf to root
    await this.traverseAsync(
      index,
      async (level, currentIndex, siblingIndex) => {
        const sibling =
          this.storage.get(PoseidonTree.indexToKey(level, siblingIndex)) ||
          this.zeros[level];
        const [left, right] =
          currentIndex % 2 === 0
            ? [currentElement, sibling]
            : [sibling, currentElement];

        keyValueToStore.push({
          key: PoseidonTree.indexToKey(level, currentIndex),
          value: currentElement,
        });

        currentElement = await this.hashLeftRight(left, right);
      }
    );

    // Store root and updated nodes
    keyValueToStore.push({
      key: PoseidonTree.indexToKey(this.levels, 0),
      value: currentElement,
    });

    keyValueToStore.forEach(({ key, value }) => this.storage.set(key, value));
  }

  // Traverses tree from leaf to root (synchronous)
  private traverse(
    index: number,
    fn: (level: number, currentIndex: number, siblingIndex: number) => void
  ): void {
    let currentIndex = index;
    for (let level = 0; level < this.levels; level++) {
      const siblingIndex =
        currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      fn(level, currentIndex, siblingIndex);
      currentIndex = Math.floor(currentIndex / 2);
    }
  }

  // Traverses tree from leaf to root (asynchronous)
  private async traverseAsync(
    index: number,
    fn: (
      level: number,
      currentIndex: number,
      siblingIndex: number
    ) => Promise<void>
  ): Promise<void> {
    let currentIndex = index;
    for (let level = 0; level < this.levels; level++) {
      const siblingIndex =
        currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      await fn(level, currentIndex, siblingIndex);
      currentIndex = Math.floor(currentIndex / 2);
    }
  }
}

// Precomputed zero values for each tree level 0..20
const ZERO_VALUES = [
  "0x1f9c815bb3f29ba2fc3f19b72e48938aed2707689809bde3eccc309ba32fe917",
  "0x26826ad1a5d1795f583284d34418d3bac2b6b2515b16a2a432cf6aa3b6443ba9",
  "0x0ed66b54d8bfb40fdba0c49e7636f8850388fcf57e53635e8f4f6be09ca832bf",
  "0x136ec4fdcd944b309c96af02b3354288305d45c3924a380b7d740456a310c007",
  "0x05357e9c92cdcb2f8f3d6d0b559644dbdc71a64287bd05ced0ffaea1f288b0f8",
  "0x0b05826301fec5aeaceacb22a23a4a98a425d1c06999b65178ddf31fdfca6f4f",
  "0x032e018fb302306660b0232159cd85aaedf00603f01cc9ad3eaaf999e1eb24b4",
  "0x0a53ee2c5d3fd7df8e86812175d3edd683322886dcbc46c91aaf314f554e42f0",
  "0x074307f10fc9aef3542720f00022e889a43df04f2d68b67fb617d5bd97c690bf",
  "0x15e905d2b53b0b5b1ea7036712ab3ae8de48a8777a89210e721ce7df6476b82d",
  "0x1faa8b22a213e896a362fe6792266534158a96e72df5c91a44d0a17edf426076",
  "0x21928b321d687fd22fc795f16320f2179fe0fe2618814cfec48503bb0876c2d3",
  "0x082656ecc9dcee31e3af4592a883b742bad86cf9479d03665ed4cd9b00bbc2fc",
  "0x13107442c825ccf2e2a47d5ddbb774ef34ce723910b966811bc9a37e33606014",
  "0x1b9ed5a57b907fb0561a542285f3566fcc869e454095c21d347f792658258874",
  "0x2b21b8073fc3f0e2a160089adbb7c1cb1929cf27349214d91cd37145f4359560",
  "0x1c30725611326f7e7ba8a6631b6a1a695fa306cdff7899ab7bb8ca33cf03903b",
  "0x143eb6a2e7258d9caeb2106cfbb42601aae181d10a45440b79efea33740b9b8b",
  "0x12a94855d8452529bf15797b895208c79705306bf4e46752ab82fc22b4eb3013",
  "0x261149ed42d50ddedc2d2a6b129194b6b30bb008cf811a03a35b5af656c533a2",
  "0x18ba2a3d100f8d229bf493d4343c5f91328376d1213b83f1e1f60a19298f2753",
];

// Creates and populates a Merkle tree
export async function merkleTree(leaves: string[]): Promise<PoseidonTree> {
  const TREE_HEIGHT = 20;
  const tree = new PoseidonTree(TREE_HEIGHT, ZERO_VALUES);
  await tree.init();

  for (const leaf of leaves) {
    await tree.insert(leaf);
  }

  return tree;
}
