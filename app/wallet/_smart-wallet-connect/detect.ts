import type { Address, PublicClient } from "viem";
import type { SmartWalletConfig } from "./types";

// Probe `walletAddress` against each candidate in order and return the first
// match. Order is significant - see `SmartWalletConfig.detect`.
//
// A candidate that throws is treated as "not this type": every probe is a
// contract read that reverts on a wallet of the wrong shape, which is the
// normal negative result rather than an error worth surfacing.
export const detectSmartWallet = async ({
  walletAddress,
  publicClient,
  chainId,
  candidates,
}: {
  walletAddress: Address;
  publicClient: PublicClient;
  chainId: number;
  candidates: SmartWalletConfig[];
}): Promise<SmartWalletConfig | null> => {
  for (const candidate of candidates) {
    if (!candidate.detect) continue;

    try {
      const matches = await candidate.detect({
        walletAddress,
        publicClient,
        chainId,
      });
      if (matches) return candidate;
    } catch {
      // Wrong shape for this wallet type - keep probing.
    }
  }

  return null;
};
