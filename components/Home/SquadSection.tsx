import Colors from "@/constants/colors";
import { squadPlayers } from "@/mocks/advertisement";
import { Image } from "expo-image";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
const { width } = Dimensions.get("window");
const CARD_WIDTH = 280;
const SquadSection = () => {
  const playerCarouseRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const handlePrev = () => {
    if (playerCarouseRef.current) {
      playerCarouseRef.current.prev();
    }
  };

  const handleNext = () => {
    if (playerCarouseRef.current) {
      playerCarouseRef.current.next();
    }
  };
  return (
    <View style={styles.adSquadSection}>
      <View style={styles.adSectionHeader}>
        <View style={styles.adHeaderLine} />
        <Text style={styles.adSectionTitle}>Players Squad</Text>
        <View style={styles.adHeaderLine} />
      </View>

      <View style={styles.quoteNavigationButtons}>
        <TouchableOpacity style={styles.quoteNavButton} onPress={handlePrev}>
          <ChevronLeft size={20} color={Colors.accent} />
        </TouchableOpacity>
        <Carousel
          ref={playerCarouseRef}
          width={width - 140}
          height={350}
          data={squadPlayers}
          renderItem={({ item }) => (
            <View key={item.id} style={styles.adPlayerCard}>
              <Image
                source={{ uri: item.photo }}
                style={styles.adPlayerImage}
                contentFit="cover"
              />
              <View style={styles.adPlayerNameContainer}>
                <Text style={styles.adPlayerName}>{item.name}</Text>
              </View>
            </View>
          )}
          onSnapToItem={(index) => setCurrentIndex(index)}
          loop
          autoPlay={true}
          autoPlayInterval={5000}
          scrollAnimationDuration={500}
        />
        <TouchableOpacity style={styles.quoteNavButton} onPress={handleNext}>
          <ChevronRight size={20} color={Colors.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  adSquadSection: {
    paddingVertical: 40,
    backgroundColor: "#2a2a2a",
    marginHorizontal: -16,
  },
  adSquadHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  adPlayerCard: {
    width: CARD_WIDTH,
    height: 320,
    borderRadius: 16,
    margin: "auto",
    overflow: "hidden",
    backgroundColor: "#2a2a2a",
  },
  adSectionTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    textAlign: "center",
  },
  adPlayerImage: {
    width: "100%",
    height: "100%",
  },
  adPlayerNameContainer: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 16,
  },
  adPlayerName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    textAlign: "center",
  },
  adSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  adHeaderLine: {
    width: 70,
    height: 2,
    backgroundColor: Colors.accent,
    marginHorizontal: 40,
  },
  adHeadSection: {
    height: 900,
    width: "100%",
    flexDirection: "column" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  adHeadBackgroundImage: {
    width: "100%",
    height: "100%",
  },
  adHeadContent: {
    position: "absolute" as const,
    alignItems: "center" as const,
  },
  adPlayerActionImage: {
    width: "100%",
    height: 322,
  },
  adQuoteContainer: {
    flexDirection: "row",
  },
  adQuoteCard: {
    padding: 16,
    alignItems: "center",
  },
  quoteNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  quoteNavigationButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 12,
  },
});

export default SquadSection;
