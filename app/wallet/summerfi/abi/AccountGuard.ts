// Summer.fi DPM "AccountGuard" - the permission + target-whitelist registry
// that every AccountImplementation defers to. Its address is baked into the
// account implementation as an immutable, so an account reports its own guard
// via `guard()` rather than us hardcoding one per chain.
export const SUMMERFI_ACCOUNT_GUARD_ABI = [
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "owners",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "target", type: "address" },
      { internalType: "address", name: "operator", type: "address" },
    ],
    name: "canCall",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "isWhitelisted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "isWhitelistedSend",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
