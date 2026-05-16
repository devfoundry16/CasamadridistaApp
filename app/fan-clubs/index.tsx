import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Spinner } from '@/components/Spinner';
import FanClubService, { FanClubCountry } from '@/services/FanClubService';
import Colors from '@/constants/colors';
import FanClubPartnershipSection from '@/components/FanClubPartnershipSection';

/**
 * Convert an ISO-3166-1 alpha-2 code to a flag emoji.
 * Each letter is mapped to its regional indicator symbol.
 */
function countryCodeToFlag(code: string | null): string {
  if (!code || code.length < 2) return '🌍';
  const upper = code.toUpperCase().slice(0, 2);
  const flagOffset = 0x1f1e6 - 65;
  return String.fromCodePoint(
    upper.charCodeAt(0) + flagOffset,
    upper.charCodeAt(1) + flagOffset
  );
}

interface CountryCardProps {
  item: FanClubCountry;
  onPress: (country: string) => void;
}

function CountryCard({ item, onPress }: CountryCardProps) {
  return (
    <Pressable
      onPress={() => onPress(item.country)}
      className="flex-1 m-1.5 rounded-2xl items-center justify-center py-4 px-2"
      style={{ backgroundColor: Colors.primary, minHeight: 90 }}
      android_ripple={{ color: Colors.darkGold }}
    >
      <Text className="text-4xl mb-1">{countryCodeToFlag(item.country_code)}</Text>
      <Text
        className="text-xs font-semibold text-center"
        style={{ color: Colors.text.primary }}
        numberOfLines={2}
      >
        {item.country}
      </Text>
    </Pressable>
  );
}

export default function FanClubsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [countries, setCountries] = useState<FanClubCountry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCountries = useCallback(async () => {
    try {
      setError(null);
      const data = await FanClubService.getCountries();
      setCountries(data);
    } catch (err: any) {
      setError(t('fanClubs.errorCountries'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    loadCountries();
  }, [loadCountries]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCountries();
  };

  const handleCountryPress = (country: string) => {
    router.push({
      pathname: '/fan-clubs/[country]',
      params: { country },
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-deep-dark">
        <Spinner content={t('fanClubs.loadingCountries')} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-deep-dark px-6">
        <Globe size={48} color={Colors.darkGold} />
        <Text className="text-white text-center mt-4 mb-6">{error}</Text>
        <Pressable
          onPress={loadCountries}
          className="py-3 px-8 rounded-xl"
          style={{ backgroundColor: Colors.darkGold }}
        >
          <Text className="text-white font-semibold">{t('fanClubs.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  const ListHeader = (
    <View className="px-4 pt-5 pb-3">
      <Text className="text-2xl font-bold text-center mb-1" style={{ color: Colors.darkGold }}>
        {t('fanClubs.title')}
      </Text>
      <Text className="text-sm text-center opacity-70 mb-4" style={{ color: Colors.text.primary }}>
        {t('fanClubs.subtitle')}
      </Text>
    </View>
  );

  const ListFooter = <FanClubPartnershipSection variant="fanClubs" />;

  return (
    <FlatList
      data={countries}
      keyExtractor={(item) => item.country}
      numColumns={3}
      contentContainerStyle={{ paddingBottom: 24 }}
      style={{ flex: 1, backgroundColor: '#111' }}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={ListFooter}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.darkGold}
        />
      }
      renderItem={({ item }) => (
        <CountryCard item={item} onPress={handleCountryPress} />
      )}
    />
  );
}
