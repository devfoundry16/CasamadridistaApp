import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '@/components/Text';
import { useRouter } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, ChevronLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import FanClubDashboardService, { RevenueTransaction } from '@/services/FanClubDashboardService';
import { useTranslation } from 'react-i18next';

export default function DashboardRevenueScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<RevenueTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  const loadRevenue = useCallback(async (pageNum: number) => {
    try {
      const res = await FanClubDashboardService.getRevenue(pageNum);
      if (pageNum === 1) {
        setTransactions(res.data);
      } else {
        setTransactions(prev => [...prev, ...res.data]);
      }
      setHasMore(res.data.length === res.limit);
    } catch (e: any) {
      setError(e.message || 'Failed to load transactions');
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadRevenue(1).finally(() => setIsLoading(false));
  }, [loadRevenue]);

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    const next = page + 1;
    setPage(next);
    await loadRevenue(next);
    setIsLoadingMore(false);
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t("common.error"), t("fanClubDashboard.invalidAmount"));
      return;
    }
    Alert.alert(t("fanClubDashboard.confirmPayout"), t("fanClubDashboard.confirmPayoutMessage", { amount: amount.toFixed(2) }), [
      { text: t("common.cancel"), style: 'cancel' },
      {
        text: t("common.confirm"),
        onPress: async () => {
          setIsRequesting(true);
          try {
            await FanClubDashboardService.requestPayout(amount);
            Alert.alert(t("common.success"), t("fanClubDashboard.payoutRequested", { amount: amount.toFixed(2) }));
            setPayoutAmount('');
            setPage(1);
            setTransactions([]);
            setIsLoading(true);
            await loadRevenue(1);
            setIsLoading(false);
          } catch (e: any) {
            Alert.alert(t("common.error"), e.message || t("fanClubDashboard.payoutFailed"));
          } finally {
            setIsRequesting(false);
          }
        },
      },
    ]);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg-medium"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-row items-center px-4 pt-14 pb-4 border-b border-border-default">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text-primary">{t("fanClubDashboard.revenuePayouts")}</Text>
      </View>

      {/* Payout Request Form */}
      <View className="mx-4 mt-4 mb-2 bg-bg-card rounded-2xl p-4">
        <Text className="text-text-primary font-semibold mb-3">{t("fanClubDashboard.requestPayout")}</Text>
        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 bg-bg-light text-text-primary rounded-xl px-4 py-3"
            placeholder={t("fanClubDashboard.amountUSD")}
            placeholderTextColor={Colors.text.secondary}
            value={payoutAmount}
            onChangeText={setPayoutAmount}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity
            className={`bg-rm-gold rounded-xl px-5 items-center justify-center ${isRequesting ? 'opacity-60' : ''}`}
            onPress={handleRequestPayout}
            disabled={isRequesting}
          >
            {isRequesting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white font-bold">{t("fanClubDashboard.request")}</Text>
            )}
          </TouchableOpacity>
        </View>
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
          data={transactions}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoadingMore ? <ActivityIndicator color={Colors.darkGold} className="my-4" /> : null
          }
          ListEmptyComponent={
            <Text className="text-text-secondary text-center mt-8">{t("fanClubDashboard.noTransactions")}</Text>
          }
          renderItem={({ item }) => {
            const isRevenue = item.type === 'revenue_share';
            return (
              <View className="bg-bg-card rounded-xl px-4 py-3 mb-2 flex-row items-center">
                <View
                  className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${isRevenue ? 'bg-green-600/20' : 'bg-rm-gold/20'}`}
                >
                  {isRevenue ? (
                    <ArrowDownLeft size={18} color="#4ade80" />
                  ) : (
                    <ArrowUpRight size={18} color={Colors.darkGold} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-text-primary font-medium text-sm">
                    {item.description || (isRevenue ? t("fanClubDashboard.revenueShare") : t("fanClubDashboard.payout"))}
                  </Text>
                  <Text className="text-text-secondary text-xs">{formatDate(item.created_at)}</Text>
                </View>
                <Text
                  className={`font-bold ${isRevenue ? 'text-green-400' : 'text-rm-gold'}`}
                >
                  {isRevenue ? '+' : '-'}${Number(item.amount).toFixed(2)}
                </Text>
              </View>
            );
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}
