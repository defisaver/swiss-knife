import { HStack, Link, Text } from "@chakra-ui/react";
import {
  Address,
  encodeFunctionData,
  isAddressEqual,
  zeroAddress,
} from "viem";
import { chainIdToChain } from "@/data/common";
import type { SmartWalletConfig } from "../_smart-wallet-connect/types";
import { SUMMERFI_ACCOUNT_ABI } from "./abi/AccountImplementation";
import { SUMMERFI_ACCOUNT_GUARD_ABI } from "./abi/AccountGuard";
import {
  DFS_REGISTRY_ADDRESSES,
  encodeRoutedRecipe,
  getSFProxyEntryPoint,
  isExecuteCallRegistered,
} from "../_dfs/recipe";

export const summerFiConfig: SmartWalletConfig = {
  kind: "summerfi",
  emoji: "☀️",
  shortName: "Summer.fi",
  configHeading: "Summer.fi Account Address",
  description:
    "Connect your Summer.fi (DPM) account to any dapp via WalletConnect. Transactions will be executed through your Summer.fi account.",

  localStorageKey: "summerFiAccountAddress",

  // Detection is structural rather than address-keyed: an account reports its
  // own AccountGuard, so this works on every chain Summer.fi deploys to without
  // us maintaining a per-chain address map.
  detect: async ({ walletAddress, publicClient }) => {
    const guard = await publicClient.readContract({
      address: walletAddress,
      abi: SUMMERFI_ACCOUNT_ABI,
      functionName: "guard",
    });

    if (!guard || isAddressEqual(guard, zeroAddress)) return false;

    // A bare `guard()` getter is not proof on its own - confirm the address it
    // points at really is an AccountGuard by calling through it.
    await publicClient.readContract({
      address: guard,
      abi: SUMMERFI_ACCOUNT_GUARD_ABI,
      functionName: "canCall",
      args: [walletAddress, walletAddress],
    });

    return true;
  },

  // Summer.fi separates ownership from permission: an account has one `owner`
  // but the guard may permit additional operators. `execute`/`send` gate on
  // `canCall`, so that - not `owners` - is the check that decides whether this
  // EOA can actually drive the account.
  checkOwner: async ({ walletAddress, eoa, publicClient }) => {
    const guard = await publicClient.readContract({
      address: walletAddress,
      abi: SUMMERFI_ACCOUNT_ABI,
      functionName: "guard",
    });

    const [owner, canCall] = await Promise.all([
      publicClient.readContract({
        address: guard,
        abi: SUMMERFI_ACCOUNT_GUARD_ABI,
        functionName: "owners",
        args: [walletAddress],
      }),
      publicClient.readContract({
        address: guard,
        abi: SUMMERFI_ACCOUNT_GUARD_ABI,
        functionName: "canCall",
        args: [walletAddress, eoa],
      }),
    ]);

    if (canCall) return { isOwner: true };

    return {
      isOwner: false,
      error: `Connected wallet is not permitted on this Summer.fi account${
        owner && !isAddressEqual(owner, zeroAddress) ? ` (owner: ${owner})` : ""
      }`,
    };
  },
  ownerCheckErrorMessage:
    "Failed to verify Summer.fi account permissions - the AccountGuard did not respond as expected",

  // Route through DeFi Saver's RecipeExecutor, the one target Summer.fi's
  // AccountGuard whitelists for delegatecall. The recipe carries a single
  // action; `encodeRoutedRecipe` picks ExecuteCall (arbitrary call) where it is
  // registered, falling back to the mapped transfer/approve/wrap actions
  // otherwise.
  wrapTransaction: async ({ walletAddress, chainId, value, to, data }) => {
    const entryPoint = await getSFProxyEntryPoint(chainId);

    if (!entryPoint) {
      throw new Error(
        `DeFi Saver's Summer.fi entry point is not registered on chain ${chainId}, so this account cannot relay transactions here.`
      );
    }

    return {
      to: walletAddress,
      // Match DSProxy: the ETH is funded by the smart wallet, not the connected
      // EOA. `value` rides inside the recipe (ExecuteCall forwards it from the
      // account's own balance), so the outer transaction carries none.
      value: 0n,
      data: encodeFunctionData({
        abi: SUMMERFI_ACCOUNT_ABI,
        functionName: "execute",
        args: [
          entryPoint,
          encodeRoutedRecipe({
            walletAddress,
            chainId,
            to,
            value,
            data,
            executeCallRegistered: await isExecuteCallRegistered(chainId),
          }),
        ],
      }),
    };
  },

  isChainSupported: (chainId) => !!DFS_REGISTRY_ADDRESSES[chainId],
  getSupportedChainNames: () =>
    Object.keys(DFS_REGISTRY_ADDRESSES).map((chainIdStr) => {
      const chainId = parseInt(chainIdStr);
      return chainIdToChain[chainId]?.name ?? `Chain ${chainId}`;
    }),

  // Execution happens on whichever chain the account lives on, via the account
  // itself - the same reasoning as DSProxy.
  walletSwitchChainBehavior: "ack",
  ackChainSwitchToast: {
    title: "Chain switch handled by Summer.fi account",
    description: (chainId) =>
      `Summer.fi account will execute on chain ${chainId}`,
  },

  ConfigFooter: ({ chainId }) => (
    <HStack spacing={2} fontSize="xs">
      <Text>{"Relayed through DeFiSaver's recipe executor on "}</Text>
      <Text>{chainIdToChain[chainId]?.name ?? `chain ${chainId}`}</Text>
      <Link
        href="https://github.com/defisaver/defisaver-v3-contracts/blob/main/contracts/actions/utils/ExecuteCall.sol"
        isExternal
        textDecoration="underline"
        display="inline"
      >
        (ExecuteCall)
      </Link>
    </HStack>
  ),
};
