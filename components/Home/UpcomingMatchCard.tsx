import Colors from "@/constants/colors";
import { Match } from "@/types/soccer/match";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/Text";
import {
  Dimensions,
  Image,
  TouchableOpacity,
  View,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
const { width } = Dimensions.get("window");

export default function UpcomingMatchesCarousel({ data }: { data: Match[] }) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const carouselRef = useRef<any>(null);

  const renderDate = (date: string) =>
    new Date(date as any).toLocaleDateString(
      i18n.language.startsWith("ar") ? "ar-SA" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  const renderCard = (item: any) => (
    <View className="bg-bg-card rounded-[10px] p-3 items-center justify-center w-[90%] h-full self-center">
      <TouchableOpacity onPress={() => router.push(`/league/${item.league.id}/${item.league.season}`)}>
        <Text className="text-text-primary text-base text-center">
          {item.league.name} {item.league.season}-{item.league.season + 1}
        </Text>
      </TouchableOpacity>
      <Text className="text-text-primary text-sm text-center mb-2">
        {item.league.round}
      </Text>

      <TouchableOpacity
        className="flex-row items-center justify-around w-full my-2"
        onPress={() => router.push(`/match/${item.fixture.id}`)}
      >
        <View className="items-center w-[30%]">
          <Image
            source={{ uri: item.teams.home.logo }}
            style={{ width: 80, height: 80 }}
            className="mb-1"
            resizeMode="contain"
          />
          <Text className="text-text-primary text-sm mt-0.5">
            {item.teams.home.name}
          </Text>
        </View>

        <Text className="text-white text-3xl font-bold">
          {item.fixture.status.short == "NS" ? "-" : item.goals.home}:
          {item.fixture.status.short == "NS" ? "-" : item.goals.away}
        </Text>

        <View className="items-center w-[30%]">
          <Image
            source={{ uri: item.teams.away.logo }}
            style={{ width: 80, height: 80 }}
            className="mb-1"
            resizeMode="contain"
          />
          <Text className="text-text-primary text-sm mt-0.5">
            {item.teams.away.name}
          </Text>
        </View>
      </TouchableOpacity>

      <Text className="mt-2.5 bg-rm-gold text-white py-1 px-3 rounded-lg text-[13px]">
        {renderDate(item.fixture.date)}
      </Text>
    </View>
  );

  return (
    <View className="bg-bg-medium py-4">
      <View className="flex-row items-center justify-center">
        <View className="w-[70px] h-0.5 bg-rm-gold mx-[30px]" />
        <Text className="text-2xl font-bold text-text-primary text-center">
          {t("home.upcomingMatch")}
        </Text>
        <View className="w-[70px] h-0.5 bg-rm-gold mx-[30px]" />
      </View>
      <View className="flex-row items-center justify-center">
        <TouchableOpacity
          className="w-[30px] h-[30px] rounded-full bg-bg-light items-center justify-center"
          onPress={() =>
            carouselRef.current?.scrollTo({ count: -1, animated: true })
          }
        >
          <ChevronLeft size={20} color={Colors.accent} />
        </TouchableOpacity>

        <Carousel
          ref={carouselRef}
          width={width * 0.9}
          height={250}
          data={data}
          scrollAnimationDuration={600}
          renderItem={({ item }) => renderCard(item)}
          style={{ flex: 0 }}
          mode="parallax"
          loop
        />

        <TouchableOpacity
          className="w-[30px] h-[30px] rounded-full bg-bg-light items-center justify-center"
          onPress={() =>
            carouselRef.current?.scrollTo({ count: 1, animated: true })
          }
        >
          <ChevronRight size={20} color={Colors.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
