// Summer.fi (formerly Oasis.app) DPM "AccountImplementation".
//
// Every Summer.fi smart wallet is an EIP-1167 minimal-proxy clone of a single
// implementation contract, so the ABI below is identical for every account.
//
// Both entrypoints consult the AccountGuard before doing anything:
//   execute(target, data) -> delegatecall, requires guard.isWhitelisted(target)
//   send(target, data)    -> call with msg.value, requires isWhitelistedSend(target)
// Failing the permission check reverts with "account-guard/no-permit"; failing
// the target check reverts with "account-guard/illegal-target".
export const SUMMERFI_ACCOUNT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_target", type: "address" },
      { internalType: "bytes", name: "_data", type: "bytes" },
    ],
    name: "execute",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_target", type: "address" },
      { internalType: "bytes", name: "_data", type: "bytes" },
    ],
    name: "send",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "guard",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
