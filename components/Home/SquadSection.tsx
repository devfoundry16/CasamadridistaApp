import Colors from "@/constants/colors";
import { squadPlayers } from "@/mocks/advertisement";
import { Image } from "expo-image";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Dimensions,
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
    <View className="py-10 bg-bg-medium -mx-4">
      <View className="flex-row items-center justify-center mb-2.5">
        <View className="w-[70px] h-0.5 bg-rm-gold mx-10" />
        <Text className="text-2xl font-bold text-text-primary text-center">
          Players Squad
        </Text>
        <View className="w-[70px] h-0.5 bg-rm-gold mx-10" />
      </View>

      <View className="flex-row items-center justify-center mt-4 gap-3">
        <TouchableOpacity
          className="w-9 h-9 rounded-full bg-white/15 justify-center items-center border border-rm-gold"
          onPress={handlePrev}
        >
          <ChevronLeft size={20} color={Colors.accent} />
        </TouchableOpacity>
        <Carousel
          ref={playerCarouseRef}
          width={Dimensions.get("window").width - 140}
          height={350}
          data={squadPlayers}
          renderItem={({ item }) => (
            <View
              key={item.id}
              className="w-[280px] h-[320px] rounded-2xl overflow-hidden bg-bg-medium"
            >
              <Image
                source={{ uri: item.photo }}
                style={{ width: 280, height: 320 }}
                contentFit="cover"
              />
              <View className="absolute bottom-0 left-0 right-0 bg-black/80 p-4">
                <Text className="text-lg font-bold text-text-primary text-center">
                  {item.name}
                </Text>
              </View>
            </View>
          )}
          onSnapToItem={(index) => setCurrentIndex(index)}
          loop
          autoPlay={true}
          autoPlayInterval={5000}
          scrollAnimationDuration={500}
        />
        <TouchableOpacity
          className="w-9 h-9 rounded-full bg-white/15 justify-center items-center border border-rm-gold"
          onPress={handleNext}
        >
          <ChevronRight size={20} color={Colors.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SquadSection;
