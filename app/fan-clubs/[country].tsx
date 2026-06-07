import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Spinner } from '@/components/Spinner';
import FanClubService, { FanClub } from '@/services/FanClubService';
import Colors from '@/constants/colors';
import FanClubPartnershipSection from '@/components/FanClubPartnershipSection';

const DEFAULT_LOGO = 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg';

interface FanClubCardProps {
  club: FanClub;
  onJoin: (club: FanClub) => void;
}

function FanClubCard({ club, onJoin }: FanClubCardProps) {
  const { t } = useTranslation();

  const foundingLabel = club.founding_year
    ? t('fanClubs.founded', { year: club.founding_year })
    : t('fanClubs.foundedUnknown');

  const description = club.description || [foundingLabel, club.address].filter(Boolean).join(' · ');

  return (
    <View
      className="mx-4 mb-4 rounded-2xl overflow-hidden"
      style={{
        backgroundColor: Colors.background.card,
        borderWidth: 1,
        borderColor: 'rgba(188,144,69,0.2)',
      }}
    >
      <View className="flex-row items-center p-4">
        <Image
          source={{ uri: club.logo_url || DEFAULT_LOGO }}
          style={{ width: 56, height: 56, borderRadius: 28 }}
          contentFit="contain"
        />
        <View className="flex-1 ml-3">
          <Text
            className="text-base font-bold mb-0.5"
            style={{ color: Colors.text.primary }}
            numberOfLines={2}
          >
            {club.name}
          </Text>
          <Text
            className="text-xs opacity-70"
            style={{ color: Colors.text.primary }}
            numberOfLines={2}
          >
            {description}
          </Text>
          {club.president && (
            <Text
              className="text-xs opacity-50 mt-0.5"
              style={{ color: Colors.text.primary }}
              numberOfLines={1}
            >
              {club.president}
            </Text>
          )}
        </View>
      </View>

      <View className="px-4 pb-4">
        <Pressable
          onPress={() => onJoin(club)}
          className="py-3 rounded-xl items-center"
          style={{ backgroundColor: Colors.darkGold }}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        >
          <Text className="text-white font-semibold text-sm">
            {t('fanClubs.joinClub')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function CountryClubsScreen() {
  const { country } = useLocalSearchParams<{ country: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const [clubs, setClubs] = useState<FanClub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClubs = useCallback(async () => {
    if (!country) return;
    try {
      setError(null);
      const data = await FanClubService.getClubsByCountry(country);
      setClubs(data);
    } catch {
      setError(t('fanClubs.errorClubs'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [country, t]);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadClubs();
  };

  const handleJoinClub = (club: FanClub) => {
    router.push({
      pathname: '/memberships/packages' as any,
      params: {
        fanClubId:   club.id,
        fanClubName: encodeURIComponent(club.name),
        country:     encodeURIComponent(club.country),
      },
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-deep-dark">
        <Spinner content={t('fanClubs.loadingClubs')} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-deep-dark px-6">
        <Users size={48} color={Colors.darkGold} />
        <Text className="text-white text-center mt-4 mb-6">{error}</Text>
        <Pressable
          onPress={loadClubs}
          className="py-3 px-8 rounded-xl"
          style={{ backgroundColor: Colors.darkGold }}
        >
          <Text className="text-white font-semibold">{t('fanClubs.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  if (clubs.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-deep-dark px-6">
        <Users size={48} color={Colors.darkGold} />
        <Text className="text-white text-center mt-4">{t('fanClubs.noClubs')}</Text>
      </View>
    );
  }

  const ListHeader = (
    <View className="px-4 pt-5 pb-3">
      <Text className="text-xl font-bold mb-1" style={{ color: Colors.text.primary }}>
        {t('fanClubs.clubsIn', { country })}
      </Text>
      <Text className="text-sm opacity-60" style={{ color: Colors.text.primary }}>
        {clubs.length} {t('fanClubs.clubs')}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={clubs}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 32 }}
      style={{ flex: 1, backgroundColor: '#111' }}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={<FanClubPartnershipSection variant="fanClubs" />}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.darkGold}
        />
      }
      renderItem={({ item }) => (
        <FanClubCard club={item} onJoin={() => handleJoinClub(item)} />
      )}
    />
  );
}
