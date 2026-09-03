import AuthForm from "@/components/Auth/AuthForm";
import { Spinner } from "@/components/Spinner";
import Colors from "@/constants/colors";
import { useUser } from "@/hooks/useUser";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  Camera,
  Check,
  ChevronRight,
  Crown,
  Globe,
  LogOut,
  Settings,
  User,
  Wallet,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from "react";
import { Text } from "@/components/Text";
import {
  Alert,
  I18nManager,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CountryFlag from "react-native-country-flag";
import { LANG_STORAGE_KEY } from "@/i18n";
import axios from "axios";
import { API_BASE_URL } from "@/config/supabase";
import { Clapperboard, LayoutDashboard, ShieldCheck } from "lucide-react-native";

type Locale = "en-US" | "ar-SA";

const LOCALES: { lng: Locale; isoCode: string; labelKey: string }[] = [
  { lng: "en-US", isoCode: "US", labelKey: "language.english" },
  { lng: "ar-SA", isoCode: "SA", labelKey: "language.arabic" },
];

export default function AccountScreen() {
  const { user, updateAvatar, logout, isLoading } = useUser();
  const { t, i18n } = useTranslation();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isFanClubAdmin, setIsFanClubAdmin] = useState(false);
  // Casa Media contributor grant. `mediaContributor` is null for everyone
  // else; a manager gets the same area through `mediaManager`.
  const [isContributor, setIsContributor] = useState(false);

  useEffect(() => {
    if (!user) return;
    AsyncStorage.getItem('auth_token').then(token => {
      if (!token) return;
      axios
        .get(`${API_BASE_URL}auth/roles`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          setIsSuperAdmin(res.data.superAdmin ?? false);
          setIsFanClubAdmin(res.data.fanClubAdmin ?? false);
          setIsContributor(
            res.data.mediaContributor?.status === 'active' || res.data.mediaManager === true,
          );
        })
        .catch(() => {});
    });
  }, [user]);

  const currentLng = i18n.language?.startsWith("ar") ? "ar-SA" : "en-US";
  const currentLocale = LOCALES.find((x) => x.lng === currentLng);

  const handleLanguageSelect = (lng: Locale) => {
    if (lng === currentLng) {
      setLanguageModalVisible(false);
      return;
    }
    const isRTL = lng === "ar-SA";
    Alert.alert(
      t("language.reloadTitle"),
      t("language.reloadMessage"),
      [
        {
          text: t("language.reloadLater"),
          style: "cancel",
          onPress: async () => {
            setLanguageModalVisible(false);
            await AsyncStorage.setItem(LANG_STORAGE_KEY, lng);
          },
        },
        {
          text: t("language.reloadNow"),
          onPress: async () => {
            setLanguageModalVisible(false);
            await AsyncStorage.setItem(LANG_STORAGE_KEY, lng);
            I18nManager.allowRTL(isRTL);
            I18nManager.forceRTL(isRTL);
            try {
              // eslint-disable-next-line @typescript-eslint/no-require-imports -- dynamic to avoid load when unavailable
              const Updates = require("expo-updates");
              if (Updates.reloadAsync) await Updates.reloadAsync();
            } catch {
              // expo-updates not available
            }
          },
        },
      ]
    );
  };

  const handleChangePhoto = async () => {
    Alert.alert(t("account.changeProfilePhoto"), t("account.selectOption"), [
      {
        text: t("account.takePhoto"),
        onPress: async () => await pickImage("camera"),
      },
      {
        text: t("account.chooseFromGallery"),
        onPress: async () => await pickImage("gallery"),
      },
      {
        text: t("common.cancel"),
        style: "cancel",
      },
    ]);
  };

  const pickImage = async (source: "camera" | "gallery") => {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(t("account.permissionDenied"), t("account.grantAccess"));
      return;
    }

    // Launch picker
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1], // Square for avatar
          quality: 0.5,
        })
        : await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    const filename = uri.split("/").pop() || `photo_${Date.now()}.jpg`;
    updateAvatar(uri, filename);
  };

  if (!user) {
    // Extracted to components/Auth/AuthForm.tsx so the Casa Media auth gate can
    // present the identical form in a modal (app/auth/login.tsx).
    return <AuthForm />;
  }

  const userName = user.profile?.first_name || user.email?.split('@')[0] || t("account.user");
  const avatarUrl = user.profile?.avatar_url;

  return (
    <ScrollView className="flex-1 bg-bg-medium">
      <View className="p-6 items-center">
        <View className="items-center mb-6">
          <View className="mb-4">
            {isLoading && <Spinner content={t("account.settingAvatar")} />}
            {avatarUrl
              ? !isLoading && (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: 120, height: 120, borderRadius: 60 }}
                  className="border-4 border-rm-gold"
                />
              )
              : !isLoading && (
                <View className="w-[120px] h-[120px] rounded-full border-4 border-rm-gold bg-bg-light justify-center items-center">
                  <User size={60} color={Colors.darkGray} />
                </View>
              )}
          </View>
          <TouchableOpacity
            className="flex-row items-center bg-rm-gold px-5 py-2.5 rounded-[25px] gap-2"
            onPress={handleChangePhoto}
          >
            <Camera size={16} color={Colors.textWhite} />
            <Text className="text-white text-sm font-semibold">{t("account.changePhoto")}</Text>
          </TouchableOpacity>
        </View>

        <View className="items-center">
          <Text className="text-2xl font-bold text-rm-gold mb-3">{t("account.welcome", { name: userName })}</Text>
          <Text className="text-sm text-text-secondary text-center leading-5">
            {t("account.profileSubtitle")}
          </Text>
        </View>
      </View>

      <View className="p-6">
        <TouchableOpacity
          className="flex-row items-center bg-rm-gold p-4 rounded-[25px] mb-3 gap-4"
          onPress={() => router.push("../account/wallet" as any)}
        >
          <Wallet size={24} color={Colors.darkBg} />
          <View className="flex-1 flex-row justify-between items-center">
            <Text className="text-base font-semibold text-text-dark">{t("nav.wallet")}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center bg-rm-gold p-4 rounded-[25px] mb-3 gap-4"
          onPress={() => router.push("../account/subscription" as any)}
        >
          <Crown size={24} color={Colors.darkBg} />
          <View className="flex-1 flex-row justify-between items-center">
            <Text className="text-base font-semibold text-text-dark">{t("nav.subscription")}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center bg-rm-gold p-4 rounded-[25px] mb-3 gap-4"
          onPress={() => router.push("../account/details" as any)}
        >
          <Settings size={24} color={Colors.darkBg} />
          <View className="flex-1 flex-row justify-between items-center">
            <Text className="text-base font-semibold text-text-dark">{t("account.editProfile")}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center bg-rm-gold p-4 rounded-[25px] mb-3 gap-4"
          onPress={() => setLanguageModalVisible(true)}
          activeOpacity={0.8}
        >
          <Globe size={24} color={Colors.darkBg} />
          <View className="flex-1 flex-row justify-between items-center">
            <Text className="text-base font-semibold text-text-dark">{t("account.language")}</Text>
            <View className="flex-row items-center gap-2">
              <CountryFlag isoCode={currentLocale?.isoCode ?? "US"} size={20} />
              <Text className="text-sm text-text-dark/90">{t(currentLocale?.labelKey ?? "language.english")}</Text>
              <ChevronRight size={20} color={Colors.darkBg} />
            </View>
          </View>
        </TouchableOpacity>

        {isSuperAdmin && (
          <TouchableOpacity
            className="flex-row items-center bg-bg-card p-4 rounded-[25px] mb-3 gap-4 border border-rm-gold"
            onPress={() => router.push('/admin' as any)}
          >
            <ShieldCheck size={24} color={Colors.darkGold} />
            <View className="flex-1 flex-row justify-between items-center">
              <Text className="text-base font-semibold text-text-primary">{t("admin.adminPanel")}</Text>
            </View>
          </TouchableOpacity>
        )}

        {isFanClubAdmin && (
          <TouchableOpacity
            className="flex-row items-center bg-bg-card p-4 rounded-[25px] mb-3 gap-4 border border-rm-gold"
            onPress={() => router.push('/fan-club-dashboard' as any)}
          >
            <LayoutDashboard size={24} color={Colors.darkGold} />
            <View className="flex-1 flex-row justify-between items-center">
              <Text className="text-base font-semibold text-text-primary">{t("admin.clubDashboard")}</Text>
            </View>
          </TouchableOpacity>
        )}

        {isContributor && (
          <TouchableOpacity
            className="flex-row items-center bg-bg-card p-4 rounded-[25px] mb-3 gap-4 border border-rm-gold"
            onPress={() => router.push('/contributor' as any)}
          >
            <Clapperboard size={24} color={Colors.darkGold} />
            <View className="flex-1 flex-row justify-between items-center">
              <Text className="text-base font-semibold text-text-primary">{t("contributor.title")}</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="flex-row items-center bg-bg-light p-4 rounded-[25px] mb-3 gap-4 border border-status-error"
          onPress={() => {
            Alert.alert(t("account.logout"), t("account.logoutConfirm"), [
              { text: t("common.cancel"), style: "cancel" },
              {
                text: t("account.logout"),
                style: "destructive",
                onPress: logout,
              },
            ]);
          }}
        >
          <LogOut size={24} color={Colors.error} />
          <View className="flex-1 flex-row justify-between items-center">
            <Text className="text-base font-semibold text-status-error">{t("account.logout")}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center px-6"
          onPress={() => setLanguageModalVisible(false)}
        >
          <Pressable
            className="w-full max-w-sm rounded-2xl overflow-hidden shadow-xl"
            style={{ backgroundColor: Colors.background.card }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="px-5 pt-5 pb-2">
              <Text className="text-lg font-bold text-white">{t("account.language")}</Text>
              <Text className="text-sm text-text-secondary mt-1">
                {t("account.languageSubtitle")}
              </Text>
            </View>
            <View className="px-2 pb-4 pt-1">
              {LOCALES.map((item) => {
                const isSelected = item.lng === currentLng;
                return (
                  <TouchableOpacity
                    key={item.lng}
                    className="flex-row items-center py-4 px-4 rounded-xl gap-3 active:opacity-80"
                    style={{ backgroundColor: isSelected ? "rgba(188, 144, 69, 0.2)" : "transparent" }}
                    onPress={() => handleLanguageSelect(item.lng)}
                    activeOpacity={0.7}
                  >
                    <CountryFlag isoCode={item.isoCode} size={28} />
                    <Text className="flex-1 text-base font-medium text-white">
                      {t(item.labelKey)}
                    </Text>
                    {isSelected && (
                      <View className="w-6 h-6 rounded-full bg-rm-gold items-center justify-center">
                        <Check size={14} color={Colors.darkBg} strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
