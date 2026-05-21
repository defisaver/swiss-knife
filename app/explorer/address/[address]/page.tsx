"use client";

import { use } from "react";
import { Box } from "@chakra-ui/react";
import { ExplorerGridBase } from "@/components/explorer/ExplorerGridBase";
import { addressExplorers } from "@/data/addressExplorers";
import { ExplorerType } from "@/types";

const Address = ({
  params,
}: {
  params: Promise<{
    address: string;
  }>;
}) => {
  const { address } = use(params);
  return (
    <Box>
      <ExplorerGridBase
        explorersData={addressExplorers}
        explorerType={ExplorerType.ADDRESS}
        addressOrTx={address}
      />
      <Box mt="1rem">🤖 = Explorers specifically for smart contracts</Box>
    </Box>
  );
};

export default Address;
