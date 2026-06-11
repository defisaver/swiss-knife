"use client";

import dynamic from "next/dynamic";

const AppsPageContent = dynamic(() => import("./AppsPageContent"), {
  ssr: false,
});

export default function Page() {
  return <AppsPageContent />;
}
