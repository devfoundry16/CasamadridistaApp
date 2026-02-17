import { Spinner } from "@/components/Spinner";
import SportsInfoService from "@/services/Football/SportsInfoService";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Dimensions, ScrollView, Text, View } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

const VenueDetailScreen = () => {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const [venue, setVenue] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const venue = await SportsInfoService.fetchVenueById(Number(id));
        setVenue(venue);
        setLoading(false);
      } catch (error) {
        Alert.alert(t("common.error"), t("venue.loading"));
      }
    };
    fetchVenue();
  }, []);

  if (id === "null") {
    return (
      <>
        <View className="flex-1 bg-bg-medium">
          <Text className="text-rm-gold text-3xl font-bold text-center">{t("venue.noInfo")}</Text>
        </View>
      </>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-medium">
        <Spinner content={t("venue.loading")} />
      </View>
    );
  }

  return (
    <>
      <ScrollView className="flex-1 bg-bg-medium" showsVerticalScrollIndicator={false}>
        <View className="items-center m-5">
          {/* Venue Name */}
          <Text className="text-text-primary text-3xl font-bold mb-4 text-center">{venue?.name}</Text>
          {/* Venue Image */}
          {venue?.image && (
            <Image
              source={{ uri: venue.image }}
              style={{ width: screenWidth - 40, height: 220 }}
              contentFit="contain"
              className="mb-4"
            />
          )}
          {/* Venue City and Country */}
          <Text className="text-white text-base mb-2.5">
            {venue?.city}, {venue?.country}
          </Text>
          {/* Venue Address */}
          {venue?.address && (
            <Text className="text-white text-base mb-2.5">Address: {venue.address}</Text>
          )}
          {/* Venue Capacity */}
          {venue?.capacity && (
            <Text className="text-white text-base mb-2.5">Capacity: {venue.capacity}</Text>
          )}
          {/* Venue Surface */}
          {venue?.surface && (
            <Text className="text-white text-base mb-2.5">Surface: {venue.surface}</Text>
          )}
        </View>
      </ScrollView>
    </>
  );
};

export default VenueDetailScreen;
