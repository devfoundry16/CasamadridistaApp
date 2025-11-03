import HeaderStack from "@/components/HeaderStack";
import { StyleSheet, View } from "react-native";

export default function CampaignsScreen() {
  return (
    <View style={styles.container}>
      <HeaderStack title="Campaigns" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
