import {
  Address,
  Hex,
  decodeFunctionData,
  encodeAbiParameters,
  encodeFunctionData,
  isAddressEqual,
  parseAbi,
  parseAbiParameters,
  zeroAddress,
} from "viem";
import { arbitrum, base, mainnet, optimism } from "viem/chains";
import { getPublicClient } from "@/lib/publicClient";
import { DFS_REGISTRY_ABI, RECIPE_EXECUTOR_ABI } from "./abi";

// Both supported wallets reach DeFi Saver through a Recipe, and a Recipe can
// only run actions registered in DFSRegistry.
//
// `ExecuteCall` is the generic "call anything" action, and it reproduces the
// dapp's request byte for byte - the same thing the DSProxy path does. It is the
// right choice for everything wherever it is registered (currently all four
// supported chains), so `routeToAction` uses it whenever available.
//
// The purpose-built actions below are the fallback for a chain where
// ExecuteCall is not (yet) registered: the common dapp operations map onto them
// so transfers, approvals and ETH wrapping still work. That mapping is a
// stand-in, not an equivalent - see MAX_UINT256 for a case where the two differ.
const DFS_ACTION_IDS = {
  sendToken: "0x02abc227",
  approveToken: "0xbb8027f4",
  wrapEth: "0x11135183",
  unwrapEth: "0x929145d0",
  executeCall: "0xd82327eb",
} as const;

// DeFi Saver's placeholder for native ETH in token-shaped actions.
const ETH_ADDRESS: Address = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const WETH_ADDRESSES: Record<number, Address> = {
  [mainnet.id]: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  [optimism.id]: "0x4200000000000000000000000000000000000006",
  [base.id]: "0x4200000000000000000000000000000000000006",
  [arbitrum.id]: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
};

const ERC20_ABI = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

const WETH_ABI = parseAbi([
  "function deposit() payable",
  "function withdraw(uint256 amount)",
]);

// `SendToken` reads type(uint256).max as "send the entire balance", whereas the
// ERC20 transfer a dapp asked for would simply revert as insufficient. Verified
// on-chain: routing that through SendToken would empty the wallet instead of
// failing. There is no faithful mapping, so these fall through to ExecuteCall.
const MAX_UINT256 = 2n ** 256n - 1n;

interface RoutedAction {
  actionId: Hex;
  // abi.encode of the action's Params struct.
  params: Hex;
  // One entry per field the action reads from _paramMapping; all zero means
  // "take the value as given" rather than pulling from a previous action.
  paramMapping: number[];
  // Human-readable, used for the recipe name.
  label: string;
}

const tryDecode = <T>(fn: () => T): T | null => {
  try {
    return fn();
  } catch {
    return null;
  }
};

// Map a dapp's {to, value, data} onto the most specific registered action that
// performs exactly the same thing. Falls back to ExecuteCall.
const routeToAction = ({
  walletAddress,
  chainId,
  to,
  value,
  data,
  executeCallRegistered,
}: {
  walletAddress: Address;
  chainId: number;
  to: Address;
  value: bigint;
  data: Hex;
  // When ExecuteCall is available it relays the request verbatim, so there is
  // no reason to prefer a stand-in that only approximates it.
  executeCallRegistered: boolean;
}): RoutedAction => {
  const executeCall: RoutedAction = {
    actionId: DFS_ACTION_IDS.executeCall,
    params: encodeAbiParameters(parseAbiParameters("(address,uint256,bytes)"), [
      [to, value, data],
    ]),
    paramMapping: [0, 0, 0],
    label: "ExecuteCall",
  };

  if (executeCallRegistered) return executeCall;

  const weth = WETH_ADDRESSES[chainId];

  // Plain ETH transfer - no calldata, just value.
  if ((!data || data === "0x") && value > 0n) {
    return {
      actionId: DFS_ACTION_IDS.sendToken,
      params: encodeAbiParameters(
        parseAbiParameters("(address,address,uint256)"),
        [[ETH_ADDRESS, to, value]]
      ),
      paramMapping: [0, 0, 0],
      label: "SendToken (ETH)",
    };
  }

  const erc20 = tryDecode(() => decodeFunctionData({ abi: ERC20_ABI, data }));

  if (erc20?.functionName === "transfer") {
    const [recipient, amount] = erc20.args;
    if (amount === MAX_UINT256) return executeCall;
    return {
      actionId: DFS_ACTION_IDS.sendToken,
      params: encodeAbiParameters(
        parseAbiParameters("(address,address,uint256)"),
        [[to, recipient, amount]]
      ),
      paramMapping: [0, 0, 0],
      label: "SendToken",
    };
  }

  if (erc20?.functionName === "approve") {
    const [spender, amount] = erc20.args;
    return {
      actionId: DFS_ACTION_IDS.approveToken,
      params: encodeAbiParameters(
        parseAbiParameters("(address,address,uint256)"),
        [[to, spender, amount]]
      ),
      paramMapping: [0, 0, 0],
      label: "ApproveToken",
    };
  }

  if (weth && isAddressEqual(to, weth)) {
    const wethCall = tryDecode(() =>
      decodeFunctionData({ abi: WETH_ABI, data })
    );

    if (wethCall?.functionName === "deposit" && value > 0n) {
      return {
        actionId: DFS_ACTION_IDS.wrapEth,
        params: encodeAbiParameters(parseAbiParameters("(uint256)"), [[value]]),
        paramMapping: [0],
        label: "WrapEth",
      };
    }

    if (wethCall?.functionName === "withdraw") {
      // `to` is where the unwrapped ETH lands; keep it on the wallet, matching
      // what WETH.withdraw() would have done.
      return {
        actionId: DFS_ACTION_IDS.unwrapEth,
        params: encodeAbiParameters(parseAbiParameters("(uint256,address)"), [
          [wethCall.args[0], walletAddress],
        ]),
        paramMapping: [0, 0],
        label: "UnwrapEth",
      };
    }
  }

  // Anything else needs the generic action.
  return executeCall;
};

// Taken from DeFi Saver's own config, then verified on-chain.
export const DFS_REGISTRY_ADDRESSES: Record<number, Address> = {
  [mainnet.id]: "0x287778F121F134C66212FB16c9b53eC991D32f5b",
  [optimism.id]: "0xAf707Ee480204Ed6e2640B53cE86F680D28Afcbd",
  [base.id]: "0x347FB634271F666353F23A3362f3935D96F97476",
  [arbitrum.id]: "0xBF1CaC12DB60819Bfa71A328282ecbc1D40443aA",
};

// bytes4(keccak256("SFProxyEntryPoint")) - the contract Summer.fi's AccountGuard
// whitelists for delegatecall. Resolved from DFSRegistry per request rather
// than hardcoded, so a redeploy on DFS's side is picked up automatically; the
// address differs on every chain.
const SF_PROXY_ENTRY_POINT_ID = "0x06f8038f";

export const getSFProxyEntryPoint = async (
  chainId: number
): Promise<Address | null> => {
  const registry = DFS_REGISTRY_ADDRESSES[chainId];
  if (!registry) return null;

  try {
    const address = await getPublicClient(chainId).readContract({
      address: registry,
      abi: DFS_REGISTRY_ABI,
      functionName: "getAddr",
      args: [SF_PROXY_ENTRY_POINT_ID],
    });
    return address && address !== zeroAddress ? address : null;
  } catch {
    return null;
  }
};

// Asked per request rather than cached, so the app switches to the faithful
// ExecuteCall path the moment DFS registers it - no redeploy, no stale flag.
export const isExecuteCallRegistered = async (chainId: number) => {
  const registry = DFS_REGISTRY_ADDRESSES[chainId];
  if (!registry) return false;

  try {
    return await getPublicClient(chainId).readContract({
      address: registry,
      abi: DFS_REGISTRY_ABI,
      functionName: "isRegistered",
      args: [DFS_ACTION_IDS.executeCall],
    });
  } catch {
    // Registry unreachable - fall back to the mapped actions rather than
    // sending a request that is certain to revert.
    return false;
  }
};

// Build `executeRecipe` calldata for a one-action recipe reproducing the dapp's
// request. Identical for every wallet; only the outer call differs.
export const encodeRoutedRecipe = ({
  walletAddress,
  chainId,
  to,
  value,
  data,
  executeCallRegistered,
}: {
  walletAddress: Address;
  chainId: number;
  to: Address;
  value: bigint;
  data: Hex;
  executeCallRegistered: boolean;
}) => {
  const action = routeToAction({
    walletAddress,
    chainId,
    to,
    value,
    data,
    executeCallRegistered,
  });

  return encodeFunctionData({
    abi: RECIPE_EXECUTOR_ABI,
    functionName: "executeRecipe",
    args: [
      {
        name: `SwissKnife${action.label.replace(/[^A-Za-z]/g, "")}`,
        callData: [action.params],
        subData: [
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        ],
        actionIds: [action.actionId],
        paramMapping: [action.paramMapping],
      },
    ],
  });
};
