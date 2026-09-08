import { HStack, Link, Text } from "@chakra-ui/react";
import { arbitrum, base, mainnet, optimism } from "viem/chains";
import { Address, encodeFunctionData } from "viem";
import { chainIdToChain } from "@/data/common";
import { getPublicClient } from "@/lib/publicClient";
import {
  encodeRoutedRecipe,
  isExecuteCallRegistered,
} from "../_dfs/recipe";
import type { SmartWalletConfig } from "../_smart-wallet-connect/types";
import { INSTA_ACCOUNT_ABI } from "./abi/InstaAccount";
import { INSTA_LIST_ABI } from "./abi/InstaList";

// InstaList (the account registry) per chain, resolved from InstaIndex.list().
// Only entries verified against a live deployment belong here - detection falls
// back to a structural probe on chains that are not listed.
const INSTA_LIST_ADDRESSES: Record<number, Address> = {
  [mainnet.id]: "0x4c8a1BEb8a87765788946D6B19C6C6355194AbEb",
};

// DeFi Saver's Instadapp connector. `cast` addresses connectors by name, so
// this string - not an address - is what reaches the account. Verified against
// a live DSA transaction: cast(["DEFI-SAVER-A"], [executeRecipe(...)], origin).
const DFS_CONNECTOR_NAME = "DEFI-SAVER-A";

// Chains where DEFI-SAVER-A is registered in that chain's InstaConnectorsV2.
// Each entry verified on-chain against the connector registry.
const DFS_CONNECTOR_CHAINS: Record<number, true> = {
  [mainnet.id]: true,
  [optimism.id]: true,
  [base.id]: true,
  [arbitrum.id]: true,
};

export const instadappDsaConfig: SmartWalletConfig = {
  kind: "instadapp-dsa",
  emoji: "🧩",
  shortName: "Instadapp DSA",
  configHeading: "Instadapp DSA Address",
  description:
    "Connect your Instadapp DeFi Smart Account to any dapp via WalletConnect.",

  localStorageKey: "instadappDsaAddress",

  detect: async ({ walletAddress, publicClient, chainId }) => {
    const list = INSTA_LIST_ADDRESSES[chainId];

    // Authoritative where we know the registry.
    if (list) {
      const accountId = await publicClient.readContract({
        address: list,
        abi: INSTA_LIST_ABI,
        functionName: "accountID",
        args: [walletAddress],
      });
      return accountId !== 0n;
    }

    // Structural fallback for chains whose registry address we have not
    // verified: a DSA account is the only thing that answers both of these.
    const version = await publicClient.readContract({
      address: walletAddress,
      abi: INSTA_ACCOUNT_ABI,
      functionName: "version",
    });
    if (version !== 1n && version !== 2n) return false;

    await publicClient.readContract({
      address: walletAddress,
      abi: INSTA_ACCOUNT_ABI,
      functionName: "isAuth",
      args: [walletAddress],
    });

    return true;
  },

  // DSA has no single owner - it keeps a set of authorised addresses, and
  // `isAuth` is exactly the predicate `cast` enforces.
  checkOwner: async ({ walletAddress, eoa, publicClient }) => {
    const isAuth = await publicClient.readContract({
      address: walletAddress,
      abi: INSTA_ACCOUNT_ABI,
      functionName: "isAuth",
      args: [eoa],
    });

    return {
      isOwner: isAuth,
      error: isAuth
        ? undefined
        : "Connected wallet is not an authorised user of this Instadapp DSA",
    };
  },
  ownerCheckErrorMessage:
    "Failed to verify Instadapp DSA authorisation - contract may not be a DSA account",

  // DFS reaches a DSA account through its own registered connector: `cast`
  // dispatches to DEFI-SAVER-A by name, which runs the same DFS recipe the
  // Summer.fi path uses. Only v2 accounts take connector names - v1 takes
  // connector addresses and DFS has no v1 connector.
  wrapTransaction: async ({ walletAddress, chainId, eoa, to, value, data }) => {
    if (!DFS_CONNECTOR_CHAINS[chainId]) {
      throw new Error(
        `DeFi Saver's ${DFS_CONNECTOR_NAME} connector is not available on chain ${chainId}, so this DSA account cannot relay transactions here.`
      );
    }

    const version = await getPublicClient(chainId).readContract({
      address: walletAddress,
      abi: INSTA_ACCOUNT_ABI,
      functionName: "version",
    });

    if (version !== 2n) {
      throw new Error(
        `This is a DSA v${version} account. Only v2 accounts dispatch connectors by name, which is how DeFi Saver's ${DFS_CONNECTOR_NAME} connector is reached.`
      );
    }

    const recipe = encodeRoutedRecipe({
      walletAddress,
      chainId,
      to,
      value,
      data,
      executeCallRegistered: await isExecuteCallRegistered(chainId),
    });

    return {
      to: walletAddress,
      // Match DSProxy: the smart wallet funds the ETH, not the EOA. `value`
      // rides inside the recipe (ExecuteCall forwards it from the DSA account's
      // own balance), so the outer cast carries none.
      value: 0n,
      data: encodeFunctionData({
        abi: INSTA_ACCOUNT_ABI,
        functionName: "cast",
        args: [[DFS_CONNECTOR_NAME], [recipe], eoa],
      }),
    };
  },

  isChainSupported: (chainId) => !!DFS_CONNECTOR_CHAINS[chainId],
  getSupportedChainNames: () =>
    Object.keys(DFS_CONNECTOR_CHAINS).map((chainIdStr) => {
      const chainId = parseInt(chainIdStr);
      return chainIdToChain[chainId]?.name ?? `Chain ${chainId}`;
    }),

  walletSwitchChainBehavior: "ack",
  ackChainSwitchToast: {
    title: "Chain switch handled by Instadapp DSA",
    description: (chainId) => `DSA account lives on chain ${chainId}`,
  },

  ConfigFooter: () => (
    <HStack spacing={2} fontSize="xs">
      <Text>Executed via</Text>
      <Link
        href="https://docs.instadapp.io/get-started/cast"
        isExternal
        textDecoration="underline"
        display="inline"
      >
        {"Instadapp's cast() + connectors"}
      </Link>
    </HStack>
  ),
};
