// Instadapp DeFi Smart Account (DSA).
//
// v1 accounts take connector *addresses*, v2 accounts take connector *names*.
// Either way `cast` resolves the argument against Instadapp's connector
// registry and delegatecalls the result, so an account can only ever run code
// that Instadapp has registered as a connector. An unregistered target reverts
// with "not-connector" (v1) / "1: not-connector" (v2); a caller that is not
// authorised reverts with "1: permission-denied".
export const INSTA_ACCOUNT_ABI = [
  {
    inputs: [
      { internalType: "string[]", name: "_targetNames", type: "string[]" },
      { internalType: "bytes[]", name: "_datas", type: "bytes[]" },
      { internalType: "address", name: "_origin", type: "address" },
    ],
    name: "cast",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "isAuth",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "version",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
