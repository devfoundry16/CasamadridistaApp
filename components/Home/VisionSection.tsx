import Colors from "@/constants/colors";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const VisionSection = () => {
  const router = useRouter();
  
  return (
    <>
      <View style={styles.adVisionSection}>
        <Image
          source={{
            uri: "https://casamadridista.com/wp-content/uploads/2025/05/ban-3.png",
          }}
          style={styles.adVisionImage}
          contentFit="cover"
        />
        <View style={styles.adVisionOverlay}>
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/4234324324.webp",
            }}
            style={styles.adFanPlayerImage}
            contentFit="cover"
          />
          <Text style={styles.adVisionTitle}>
            Got a Vision? Let&apos;s Talk It Through
          </Text>
          <Text style={styles.adVisionSubtitle}>
            Your Ideas Matter Share Them with Us
          </Text>
          <TouchableOpacity
            style={styles.adContactButton}
            onPress={() => router.push("/contact")}
          >
            <Text style={styles.adContactButtonText}>Contact Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default VisionSection;

const styles = StyleSheet.create({
  adVisionSection: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 500,
  },
  adVisionImage: {
    width: "100%",
    height: "100%",
  },
  adFanPlayerImage: {
    width: "80%",
    height: 300,
  },
  adVisionOverlay: {
    position: "absolute" as const,
    alignItems: "center" as const,
  },
  adVisionTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    textAlign: "center",
    marginBottom: 8,
  },
  adVisionSubtitle: {
    fontSize: 14,
    color: Colors.textWhite,
    textAlign: "center",
    marginBottom: 20,
  },
  adContactButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  adContactButtonText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#1a1a1a",
  },
});