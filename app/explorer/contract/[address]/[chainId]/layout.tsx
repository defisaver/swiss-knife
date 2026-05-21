import { getMetadata } from "@/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  return getMetadata({
    title: `Contract ${address} | Swiss-Knife.xyz`,
    description:
      "Best UI to interact with smart contracts. Read & Write contract functions with human readable output!",
    images: `https://swiss-knife.xyz/og/contract.png`, // FIXME: add meta image for contract explorer page
  });
}

const ContractLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default ContractLayout;
