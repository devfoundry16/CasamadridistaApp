import HeaderStack from "@/components/HeaderStack";
import { WalletScreenDetail } from "@/components/Wallet/FlinTopWallet";
import Colors from "@/constants/colors";
import React from "react";
import { StyleSheet } from "react-native";

export default function WalletScreen() {
  return (
    <>
      <HeaderStack title="Wallet" />
      <WalletScreenDetail />
    </>
  );
}
