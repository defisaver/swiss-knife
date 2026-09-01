import { getMetadata } from "@/utils";
import { Metadata } from "next";

const _metadataInfo = {
  title: "Smart Wallet Connect | Swiss-Knife.xyz",
  description:
    "Connect your DSProxy, Summer.fi or Instadapp DSA smart wallet to any dapp via WalletConnect. The wallet type is detected automatically from the address.",
  images: "https://swiss-knife.xyz/og/wallet-ds-proxy.png",
};

export const metadata: Metadata = {
  ...getMetadata(_metadataInfo),
};

const SmartWalletLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default SmartWalletLayout;
