import Colors from "@/constants/colors";
import { quotes } from "@/mocks/advertisement";
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

const QuoteSection = () => {
  const quoteCarouselRef = useRef<any>(null);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  const handleNextQuote = () => {
    if (quoteCarouselRef.current) {
      quoteCarouselRef.current.next();
    }
  };

  const handlePrevQuote = () => {
    if (quoteCarouselRef.current) {
      quoteCarouselRef.current.prev();
    }
  };
  return (
    <>
      <View style={styles.adHeadSection}>
        <Image
          source={{
            uri: "https://casamadridista.com/wp-content/uploads/2025/05/img3.png",
          }}
          style={styles.adHeadBackgroundImage}
          contentFit="cover"
        />

        <View style={styles.adHeadContent}>
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/43534535.webp",
            }}
            style={styles.adPlayerActionImage}
            contentFit="fill"
          />
          <View style={styles.adQuoteContainer}>
            <View style={styles.quoteNavigationButtons}>
              <TouchableOpacity
                style={{
                  ...styles.quoteNavButton,
                  borderColor: Colors.primary,
                }}
                onPress={handlePrevQuote}
              >
                <ChevronLeft size={20} color={Colors.primary} />
              </TouchableOpacity>
              <Carousel
                ref={quoteCarouselRef}
                width={width - 140}
                height={500}
                data={quotes}
                renderItem={({ item }) => (
                  <View style={styles.adQuoteCard}>
                    <Image
                      source={{ uri: item.photo }}
                      style={styles.adHeadPhoto}
                      contentFit="cover"
                    />
                    <Text style={styles.adQuote}>{item.text}</Text>
                    <Text style={styles.adHeadName}>{item.author}</Text>
                    <Text style={styles.adHeadTitle}>{item.role}</Text>
                  </View>
                )}
                onSnapToItem={(index) => setCurrentQuoteIndex(index)}
                loop
                autoPlay={true}
                autoPlayInterval={5000}
                scrollAnimationDuration={500}
              />
              <TouchableOpacity
                style={{
                  ...styles.quoteNavButton,
                  borderColor: Colors.primary,
                }}
                onPress={handleNextQuote}
              >
                <ChevronRight size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </>
  );
};
export default QuoteSection;

const styles = StyleSheet.create({
  adQuoteContainer: {
    flexDirection: "row",
  },
  adQuoteCard: {
    padding: 16,
    alignItems: "center",
  },
  adHeadPhoto: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: Colors.accent,
  },
  adQuote: {
    fontSize: 15,
    color: Colors.textWhite,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 18,
  },
  adHeadName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginBottom: 4,
    fontStyle: "italic",
  },
  adHeadTitle: {
    fontSize: 12,
    color: Colors.accent,
  },
  quoteNavigationButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 12,
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
  quoteIndicators: {
    flexDirection: "row",
    gap: 6,
  },
  quoteIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  quoteIndicatorActive: {
    backgroundColor: Colors.accent,
    width: 24,
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
});
