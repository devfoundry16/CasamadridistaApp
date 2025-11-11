import Colors from "@/constants/colors";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export const Spinner = ({ content }: { content: string }) => {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={Colors.darkGold} />
      <Text style={styles.content}>{content}...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "none",
  },
  content: {
    color: Colors.textWhite,
    fontSize: 18,
  },
});
