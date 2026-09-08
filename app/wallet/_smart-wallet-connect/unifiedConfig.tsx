import type { SmartWalletConfig } from "./types";

// Presentation shell for the unified page: what the card shows before an
// address has been typed and identified. Once detection resolves, the detected
// wallet's own config takes over every behavioural field, so the throwing
// members here are unreachable in practice and exist to make a regression loud
// rather than silent.
export const unifiedSmartWalletConfig: SmartWalletConfig = {
  kind: "ds-proxy",
  emoji: "🔐",
  shortName: "Smart Wallet",
  configHeading: "Smart Wallet Address",
  description:
    "Connect your DSProxy, Summer.fi, or Instadapp DSA account to any dapp via WalletConnect. Paste the address and the wallet type is detected automatically.",

  localStorageKey: "smartWalletAddress",

  // The address has not been identified yet, so nothing is ruled out on chain
  // support - the detected wallet's own config decides.
  isChainSupported: () => true,
  getSupportedChainNames: () => [],

  checkOwner: async () => ({
    isOwner: false,
    error: "Smart wallet type has not been detected yet",
  }),
  ownerCheckErrorMessage: "Smart wallet type has not been detected yet",

  wrapTransaction: () => {
    throw new Error("Smart wallet type has not been detected yet");
  },

  walletSwitchChainBehavior: "ack",
};
