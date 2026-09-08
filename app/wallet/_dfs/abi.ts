// DeFi Saver's Recipe format, shared by every smart wallet that reaches DFS
// through a recipe rather than by calling ExecuteCall directly.
//
// A Recipe is a sequence of actions addressed by 4-byte id; the executor
// resolves each id through DFSRegistry and delegatecalls the action. Both
// supported wallets carry the identical struct and differ only in how they
// reach it:
//   Summer.fi     account.execute(RecipeExecutor, executeRecipe(...))
//   Instadapp DSA account.cast(["DEFI-SAVER-A"], [executeRecipe(...)], origin)
export const RECIPE_EXECUTOR_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "string", name: "name", type: "string" },
          { internalType: "bytes[]", name: "callData", type: "bytes[]" },
          { internalType: "bytes32[]", name: "subData", type: "bytes32[]" },
          { internalType: "bytes4[]", name: "actionIds", type: "bytes4[]" },
          { internalType: "uint8[][]", name: "paramMapping", type: "uint8[][]" },
        ],
        internalType: "struct StrategyModel.Recipe",
        name: "_currRecipe",
        type: "tuple",
      },
    ],
    name: "executeRecipe",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;

// DFSRegistry - maps an action's 4-byte id to its deployed address. An action
// that is not registered here cannot be used in a recipe.
export const DFS_REGISTRY_ABI = [
  {
    inputs: [{ internalType: "bytes4", name: "_id", type: "bytes4" }],
    name: "getAddr",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes4", name: "_id", type: "bytes4" }],
    name: "isRegistered",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
