import HeaderStack from "@/components/HeaderStack";
import { WalletScreenDetail } from "@/components/Wallet/FlinTopWallet";
import React from "react";

export default function WalletScreen() {
  return (
    <>
      <HeaderStack title="Wallet" />
      <WalletScreenDetail />
    </>
  );
}
