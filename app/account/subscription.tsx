import { Spinner } from "@/components/Spinner";
import { useSubscription } from "@/hooks/useSubscription";
import { formatDate } from "@/utils/helper";
import MemberRegistrationService from "@/services/MemberRegistrationService";
import { development } from "@/config/environment";
import { router } from "expo-router";
import { ArrowRight, Calendar, Crown, QrCode, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/Text";
import QRCode from "react-native-qrcode-svg";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

const BACKEND_BASE = (development.DEFAULT_BACKEND_API_URL || "https://casamadridista-backend.vercel.app/api/").replace(/\/api\/$/, "");

function buildVerifyUrl(token: string): string {
  return `${BACKEND_BASE}/api/verify/${token}`;
}

export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const { subscriptions, isLoading, loadSubscriptions } = useSubscription();

  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    if (subscriptions && subscriptions.length > 0) {
      loadQrToken();
    }
  }, [subscriptions]);

  const loadQrToken = async () => {
    try {
      setQrLoading(true);
      const token = await MemberRegistrationService.getQrToken();
      setQrToken(token);
    } catch {
      // Non-fatal — QR simply won't show if the request fails
    } finally {
      setQrLoading(false);
    }
  };

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
            const statusColor = subscription.status === "active" ? "#BC9045" : "#666";
            const statusText =
              subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1);

            const verifyUrl = qrToken ? buildVerifyUrl(qrToken) : null;

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
                        <Text className="text-sm text-text-secondary mb-1">
                          {t("subscription.startDate")}
                        </Text>
                        <Text className="text-base font-semibold text-white">
                          {formatDate(subscription.start_date)}
                        </Text>
                      </View>
                    </View>
                    {subscription.end_date && (
                      <View className="flex-row items-center gap-3">
                        <Calendar size={20} color="#BC9045" />
                        <View className="flex-1">
                          <Text className="text-sm text-text-secondary mb-1">
                            {t("subscription.endDate")}
                          </Text>
                          <Text className="text-base font-semibold text-white">
                            {formatDate(subscription.end_date)}
                          </Text>
                        </View>
                      </View>
                    )}
                    <View className="flex-row items-center gap-3">
                      <View className="flex-1">
                        <Text className="text-sm text-text-secondary mb-1">
                          {t("subscription.price")}
                        </Text>
                        <Text className="text-base font-semibold text-white">
                          {subscription.currency} {subscription.price}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* QR Code Section */}
                  <View className="w-full mt-6 pt-6 items-center" style={{ borderTopWidth: 1, borderTopColor: "#2a2a2a" }}>
                    <View className="flex-row items-center gap-2 mb-4">
                      <QrCode size={16} color="#BC9045" />
                      <Text className="text-sm font-semibold text-rm-gold">
                        {t("subscription.membershipQr", "Membership QR Code")}
                      </Text>
                    </View>

                    {qrLoading ? (
                      <ActivityIndicator color="#BC9045" size="small" />
                    ) : verifyUrl ? (
                      <TouchableOpacity
                        onPress={() => setQrModalVisible(true)}
                        activeOpacity={0.85}
                      >
                        <View className="p-3 bg-white rounded-xl">
                          <QRCode
                            value={verifyUrl}
                            size={140}
                            color="#000000"
                            backgroundColor="#ffffff"
                          />
                        </View>
                        <Text className="text-xs text-text-secondary text-center mt-2">
                          {t("subscription.tapToEnlarge", "Tap to enlarge")}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                <View className="p-6 pt-0 gap-3">
                  <TouchableOpacity
                    className="flex-row items-center bg-bg-light p-4 rounded-xl gap-3"
                    onPress={() => router.push("/memberships/packages")}
                  >
                    <Crown size={24} color="#BC9045" />
                    <Text className="flex-1 text-base font-semibold text-white">
                      {t("subscription.upgradePlan")}
                    </Text>
                    <ArrowRight size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <View className="flex-1 items-center justify-center p-12 mt-24">
            <Crown size={64} color="#515151" />
            <Text className="text-2xl font-bold text-white mt-6 mb-2">
              {t("subscription.noActive")}
            </Text>
            <Text className="text-base text-text-secondary text-center mb-8">
              {t("subscription.joinBenefits")}
            </Text>
            <TouchableOpacity
              className="bg-rm-gold px-8 py-4 rounded-[25px]"
              onPress={() => router.push("/memberships/packages")}
            >
              <Text className="text-base font-bold text-bg-deep-dark">
                {t("subscription.viewPlans")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Enlarged QR Modal */}
      <Modal
        visible={qrModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" }}
        >
          <View className="bg-bg-deep-dark rounded-2xl p-8 items-center mx-6" style={{ borderWidth: 1, borderColor: "#BC9045" }}>
            <TouchableOpacity
              onPress={() => setQrModalVisible(false)}
              style={{ position: "absolute", top: 16, right: 16 }}
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View className="flex-row items-center gap-2 mb-6 mt-2">
              <QrCode size={20} color="#BC9045" />
              <Text className="text-lg font-bold text-rm-gold">
                {t("subscription.membershipQr", "Membership QR Code")}
              </Text>
            </View>

            {qrToken && (
              <View className="p-4 bg-white rounded-xl">
                <QRCode
                  value={buildVerifyUrl(qrToken)}
                  size={240}
                  color="#000000"
                  backgroundColor="#ffffff"
                />
              </View>
            )}

            <Text className="text-sm text-text-secondary text-center mt-4 leading-5">
              {t("subscription.qrScanHint", "Scan this code to verify your membership")}
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}
