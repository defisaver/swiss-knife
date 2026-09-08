import { dsProxyConfig } from "../ds-proxy/config";
import { summerFiConfig } from "../summerfi/config";
import { instadappDsaConfig } from "../instadapp-dsa/config";
import type { SmartWalletConfig } from "./types";

// ORDER IS SIGNIFICANT. Detection returns the first match, so wallets with a
// distinctive marker come first and DSProxy - identified by `owner()` plus its
// DSProxyCache pointer, the least distinctive pair - must stay last.
export const SMART_WALLET_CANDIDATES: SmartWalletConfig[] = [
  summerFiConfig,
  instadappDsaConfig,
  dsProxyConfig,
];
