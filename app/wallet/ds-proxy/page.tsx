"use client";

import SmartWalletConnect from "../_smart-wallet-connect/SmartWalletConnect";
import { SMART_WALLET_CANDIDATES } from "../_smart-wallet-connect/candidates";
import { unifiedSmartWalletConfig } from "../_smart-wallet-connect/unifiedConfig";

export default function SmartWalletPage() {
  return (
    <SmartWalletConnect
      config={unifiedSmartWalletConfig}
      candidates={SMART_WALLET_CANDIDATES}
    />
  );
}
