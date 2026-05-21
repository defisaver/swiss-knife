"use client";

import { use } from "react";
import { ExplorerGridBase } from "@/components/explorer/ExplorerGridBase";
import { txExplorers } from "@/data/txExplorers";
import { ExplorerType } from "@/types";

const Tx = ({
  params,
}: {
  params: Promise<{
    tx: string;
  }>;
}) => {
  const { tx } = use(params);
  return (
    <ExplorerGridBase
      explorersData={txExplorers}
      explorerType={ExplorerType.TX}
      addressOrTx={tx}
    />
  );
};

export default Tx;
