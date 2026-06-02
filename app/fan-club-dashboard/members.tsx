import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/Text';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import FanClubDashboardService, { DashboardMember } from '@/services/FanClubDashboardService';

export default function DashboardMembersScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<DashboardMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async (pageNum: number) => {
    try {
      const res = await FanClubDashboardService.getMembers(pageNum);
      if (pageNum === 1) {
        setMembers(res.data);
      } else {
        setMembers(prev => [...prev, ...res.data]);
      }
      setHasMore(res.data.length === res.limit);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load members');
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadMembers(1).finally(() => setIsLoading(false));
  }, [loadMembers]);

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await loadMembers(nextPage);
    setIsLoadingMore(false);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <View className="flex-1 bg-bg-medium">
      <View className="flex-row items-center px-4 pt-14 pb-4 border-b border-border-default">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text-primary">Members</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Colors.darkGold} size="large" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-text-secondary text-center">{error}</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoadingMore ? <ActivityIndicator color={Colors.darkGold} className="my-4" /> : null
          }
          ListEmptyComponent={
            <Text className="text-text-secondary text-center mt-8">No members yet</Text>
          }
          renderItem={({ item }) => {
            const name = [item.user_profiles.first_name, item.user_profiles.last_name]
              .filter(Boolean)
              .join(' ');
            return (
              <View className="bg-bg-card rounded-xl px-4 py-3 mb-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-text-primary font-semibold">
                      {name || item.user_profiles.email}
                    </Text>
                    {name ? (
                      <Text className="text-text-secondary text-sm">{item.user_profiles.email}</Text>
                    ) : null}
                    <Text className="text-text-secondary text-xs mt-1">
                      Joined {formatDate(item.created_at)}
                    </Text>
                  </View>
                  <View
                    className={`px-2 py-1 rounded-full ${item.status === 'active' ? 'bg-green-600/20' : 'bg-gray-600/20'}`}
                  >
                    <Text
                      className={`text-xs font-semibold capitalize ${item.status === 'active' ? 'text-green-400' : 'text-gray-400'}`}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
