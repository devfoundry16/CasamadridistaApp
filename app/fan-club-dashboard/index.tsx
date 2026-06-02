import React, { useEffect, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/Text';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, TrendingUp, Users, Wallet } from 'lucide-react-native';
import Colors from '@/constants/colors';
import FanClubDashboardService, { DashboardOverview } from '@/services/FanClubDashboardService';

export default function FanClubDashboardScreen() {
  const router = useRouter();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    FanClubDashboardService.getOverview()
      .then(setOverview)
      .catch(e => setError(e.message || 'Failed to load dashboard'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <View className="flex-1 bg-bg-medium">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-14 pb-4 border-b border-border-default">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-text-primary">Club Dashboard</Text>
          {overview && (
            <Text className="text-text-secondary text-sm">{overview.club.name}</Text>
          )}
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
      ) : overview ? (
        <View className="flex-1 px-4 pt-6">
          {/* Stat Cards */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-bg-card rounded-2xl p-4 items-center">
              <Users size={24} color={Colors.darkGold} />
              <Text className="text-2xl font-bold text-text-primary mt-2">
                {overview.activeMembers}
              </Text>
              <Text className="text-text-secondary text-xs text-center mt-1">Active Members</Text>
            </View>
            <View className="flex-1 bg-bg-card rounded-2xl p-4 items-center">
              <TrendingUp size={24} color={Colors.darkGold} />
              <Text className="text-2xl font-bold text-text-primary mt-2">
                ${overview.monthlyRevenue.toFixed(2)}
              </Text>
              <Text className="text-text-secondary text-xs text-center mt-1">This Month</Text>
            </View>
          </View>

          <View className="bg-bg-card rounded-2xl p-4 mb-6 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Wallet size={28} color={Colors.darkGold} />
              <View>
                <Text className="text-text-secondary text-sm">Wallet Balance</Text>
                <Text className="text-2xl font-bold text-text-primary">
                  ${overview.walletBalance.toFixed(2)}
                </Text>
              </View>
            </View>
            <View className="bg-bg-light rounded-lg px-3 py-1">
              <Text className="text-rm-gold text-sm font-semibold">
                {overview.club.revenue_percentage}% share
              </Text>
            </View>
          </View>

          {/* Navigation Links */}
          <TouchableOpacity
            className="bg-bg-card rounded-xl px-4 py-4 mb-3 flex-row items-center justify-between"
            onPress={() => router.push('/fan-club-dashboard/members' as any)}
          >
            <View className="flex-row items-center gap-3">
              <Users size={20} color={Colors.darkGold} />
              <Text className="text-text-primary font-semibold">Members</Text>
            </View>
            <ChevronRight size={20} color={Colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-bg-card rounded-xl px-4 py-4 flex-row items-center justify-between"
            onPress={() => router.push('/fan-club-dashboard/revenue' as any)}
          >
            <View className="flex-row items-center gap-3">
              <TrendingUp size={20} color={Colors.darkGold} />
              <Text className="text-text-primary font-semibold">Revenue & Payouts</Text>
            </View>
            <ChevronRight size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
