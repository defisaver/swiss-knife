// Instadapp's on-chain account registry. `accountID` returns a non-zero id for
// any address that is a DSA account and 0 for anything else, which makes it the
// authoritative membership test wherever we know the registry address.
export const INSTA_LIST_ABI = [
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "accountID",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
