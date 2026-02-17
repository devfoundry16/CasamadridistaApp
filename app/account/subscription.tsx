import { Spinner } from "@/components/Spinner";
import { useSubscription } from "@/hooks/useSubscription";
import { formatDate } from "@/utils/helper";
import { router } from "expo-router";
import { ArrowRight, Calendar, Crown } from "lucide-react-native";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const { subscriptions, isLoading, loadSubscriptions } = useSubscription();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-medium">
        <Spinner content={t("account.loadingSubscription")} />
      </View>
    );
  }

  return (
    <>
      <ScrollView className="flex-1 bg-bg-medium">
        {subscriptions?.length ? (
          subscriptions.map((subscription) => {
            const statusColor = subscription.status === 'active' ? '#BC9045' : '#666';
            const statusText = subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1);
            
            return (
              <View key={subscription.id}>
                <View className="m-6 p-8 bg-bg-deep-dark rounded-[20px] items-center border-2 border-rm-gold">
                  <View className="w-20 h-20 rounded-[40px] bg-bg-medium justify-center items-center mb-4">
                    <Crown size={48} color="#BC9045" />
                  </View>
                  <Text className="text-[28px] font-bold text-rm-gold mb-2 text-center">
                    {subscription.subscription_type}
                  </Text>
                  <Text className="text-sm text-text-secondary mb-4" style={{ color: statusColor }}>
                    {statusText}
                  </Text>

                  <View className="w-full gap-4">
                    <View className="flex-row items-center gap-3">
                      <Calendar size={20} color="#BC9045" />
                      <View className="flex-1">
                        <Text className="text-sm text-text-secondary mb-1">Start Date</Text>
                        <Text className="text-base font-semibold text-white">
                          {formatDate(subscription.start_date)}
                        </Text>
                      </View>
                    </View>
                    {subscription.end_date && (
                      <View className="flex-row items-center gap-3">
                        <Calendar size={20} color="#BC9045" />
                        <View className="flex-1">
                          <Text className="text-sm text-text-secondary mb-1">End Date</Text>
                          <Text className="text-base font-semibold text-white">
                            {formatDate(subscription.end_date)}
                          </Text>
                        </View>
                      </View>
                    )}
                    <View className="flex-row items-center gap-3">
                      <View className="flex-1">
                        <Text className="text-sm text-text-secondary mb-1">Price</Text>
                        <Text className="text-base font-semibold text-white">
                          {subscription.currency} {subscription.price}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View className="p-6 pt-0 gap-3">
                  <TouchableOpacity
                    className="flex-row items-center bg-bg-light p-4 rounded-xl gap-3"
                    onPress={() => router.push("/memberships/packages")}
                  >
                    <Crown size={24} color="#BC9045" />
                    <Text className="flex-1 text-base font-semibold text-white">Upgrade Plan</Text>
                    <ArrowRight size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <View className="flex-1 items-center justify-center p-12 mt-24">
            <Crown size={64} color="#515151" />
            <Text className="text-2xl font-bold text-white mt-6 mb-2">No Active Subscription</Text>
            <Text className="text-base text-text-secondary text-center mb-8">
              Join Casa Madridista and enjoy exclusive benefits
            </Text>
            <TouchableOpacity
              className="bg-rm-gold px-8 py-4 rounded-[25px]"
              onPress={() => router.push("/memberships/packages")}
            >
              <Text className="text-base font-bold text-bg-deep-dark">
                View Membership Plans
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </>
  );
}
