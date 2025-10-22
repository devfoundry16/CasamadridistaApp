import HeaderStack from "@/components/HeaderStack";
import { Spinner } from "@/components/Spinner";
import Colors from "@/constants/colors";
import SportsInfoService from "@/services/SportsInfoService";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

const VenueDetailScreen = () => {
  const router = useRouter();
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
        Alert.alert("Error", "Error occurs while loading venue");
      }
    };
    fetchVenue();
  }, []);

  if (loading) {
    return (
      <>
        <HeaderStack title="Venue Details" />
        <Spinner content="Loading venue" />
      </>
    );
  }

  return (
    <>
      <HeaderStack title={venue?.name} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: "center", margin: 20 }}>
          {/* Venue Name */}
          <Text style={styles.venueName}>{venue?.name}</Text>
          {/* Venue Image */}
          {venue?.image && (
            <Image
              source={{ uri: venue.image }}
              contentFit="contain"
              style={styles.venueLogo}
            />
          )}
          {/* Venue City and Country */}
          <Text style={styles.venueCountry}>
            {venue?.city}, {venue?.country}
          </Text>
          {/* Venue Address */}
          {venue?.address && (
            <Text style={styles.venueAddress}>Address: {venue.address}</Text>
          )}
          {/* Venue Capacity */}
          {venue?.capacity && (
            <Text style={styles.venueCapacity}>Capacity: {venue.capacity}</Text>
          )}
          {/* Venue Surface */}
          {venue?.surface && (
            <Text style={styles.venueSurface}>Surface: {venue.surface}</Text>
          )}
        </View>
      </ScrollView>
    </>
  );
};

export default VenueDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepDarkGray,
  },
  venueName: {
    color: Colors.darkGold,
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 15,
  },
  venueLogo: {
    width: "100%",
    height: "100%",
    marginBottom: 15,
  },
  venueCountry: {
    color: Colors.textWhite,
    fontSize: 16,
    marginBottom: 10,
  },
  venueAddress: {
    color: Colors.textWhite,
    fontSize: 16,
    marginBottom: 10,
  },
  venueCapacity: {
    color: Colors.textWhite,
    fontSize: 16,
    marginBottom: 10,
  },
  venueSurface: {
    color: Colors.textWhite,
    fontSize: 16,
    marginBottom: 10,
  },
});
