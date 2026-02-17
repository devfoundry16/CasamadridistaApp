import Colors from "@/constants/colors";
import { quotes } from "@/mocks/advertisement";
import { Image } from "expo-image";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { Text } from "@/components/Text";
import {
  Dimensions,
  TouchableOpacity,
  View,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
const { width: screenWidth } = Dimensions.get("window");

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
      <View className="h-[900px] w-full flex-col items-center justify-center">
        <Image
          source={{
            uri: "https://casamadridista.com/wp-content/uploads/2025/05/img3.png",
          }}
          style={{ width: screenWidth, height: 900 }}
          contentFit="cover"
        />

        <View className="absolute items-center">
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/43534535.webp",
            }}
            style={{ width: screenWidth, height: 322 }}
            contentFit="contain"
          />
          <View className="flex-row items-center justify-center mt-4 gap-3">
              <TouchableOpacity
                className="w-9 h-9 rounded-full bg-white/15 justify-center items-center border border-rm-gold"
                onPress={handlePrevQuote}
              >
                <ChevronLeft size={20} color={Colors.primary} />
              </TouchableOpacity>
              <Carousel
                ref={quoteCarouselRef}
                width={screenWidth - 140}
                height={500}
                data={quotes}
                renderItem={({ item }) => (
                  <View className="p-4 items-center">
                    <Image
                      source={{ uri: item.photo }}
                      style={{ width: 200, height: 200, borderRadius: 100 }}
                      className="mb-3 border-[3px] border-rm-gold"
                      contentFit="cover"
                    />
                    <Text className="text-[15px] text-text-primary text-center mb-3 leading-[18px]">
                      {item.text}
                    </Text>
                    <Text className="text-[15px] font-bold text-text-primary mb-1 italic">
                      {item.author}
                    </Text>
                    <Text className="text-xs text-rm-gold">{item.role}</Text>
                  </View>
                )}
                onSnapToItem={(index) => setCurrentQuoteIndex(index)}
                loop
                autoPlay={true}
                autoPlayInterval={5000}
                scrollAnimationDuration={500}
              />
              <TouchableOpacity
                className="w-9 h-9 rounded-full bg-white/15 justify-center items-center border border-rm-gold"
                onPress={handleNextQuote}
              >
                <ChevronRight size={20} color={Colors.primary} />
              </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
};
export default QuoteSection;
