import { Spinner } from "@/components/Spinner";
import Colors from "@/constants/colors";
import { useUser } from "@/hooks/useUser";
import * as AppleAuthentication from "expo-apple-authentication";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  Camera,
  Check,
  ChevronRight,
  Crown,
  Globe,
  Lock,
  LogOut,
  Mail,
  Phone,
  Settings,
  User,
  Wallet,
} from "lucide-react-native";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { Text } from "@/components/Text";
import {
  Alert,
  I18nManager,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CountryFlag from "react-native-country-flag";
import { LANG_STORAGE_KEY } from "@/i18n";

type Locale = "en-US" | "ar-SA";

const LOCALES: { lng: Locale; isoCode: string; labelKey: string }[] = [
  { lng: "en-US", isoCode: "US", labelKey: "language.english" },
  { lng: "ar-SA", isoCode: "SA", labelKey: "language.arabic" },
];

export default function AccountScreen() {
  const { user, updateAvatar, logout, isLoading } = useUser();
  const { t, i18n } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

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
    return <AuthForm isLogin={isLogin} setIsLogin={setIsLogin} />;
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

function AuthForm({
  isLogin,
  setIsLogin,
}: {
  isLogin: boolean;
  setIsLogin: (value: boolean) => void;
}) {
  const { login, register, signInWithGoogle, signInWithApple, isLoading } = useUser();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async () => {
    if (isLogin) {
      if (!email || !password) {
        Alert.alert(t("common.error"), t("account.pleaseFillAllFields"));
        return;
      }
      login(email, password);
    } else {
      if (!email || !password || !firstName || !lastName) {
        Alert.alert(t("common.error"), t("account.pleaseFillRequiredFields"));
        return;
      }
      await register({
        email,
        password,
        firstName,
        lastName,
        phone,
      });
    }
  };
  const handleGoogleSignIn = () => {
    signInWithGoogle();
  };

  return (
    <ScrollView className="flex-1 bg-bg-medium">
      <View className="p-8 pt-12 pb-10 items-center">
        <View
          className="rounded-[22px] overflow-hidden mb-2"
          style={{ width: 100, height: 100 }}
        >
          <Image
            source={require("@/assets/icons/splash-icon-dark.png")}
            style={{ width: 100, height: 100 }}
            resizeMode="cover"
          />
        </View>
        <Text className="text-[28px] font-bold text-white mb-2">
          {isLogin ? t("auth.welcomeBack") : t("auth.createAccount")}
        </Text>
        <Text className="text-base text-text-secondary text-center">
          {isLogin ? t("auth.signInSubtitle") : t("auth.joinSubtitle")}
        </Text>
      </View>

      <View className="p-6">
        {!isLogin && (
          <>
            <View className="mb-5">
              <Text className="text-sm font-semibold text-white mb-2">{t("auth.firstName")}</Text>
              <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
                <User size={18} color={Colors.textLight} />
                <TextInput
                  className="flex-1 py-4 pl-3 text-base text-white"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder={t("auth.enterFirstName")}
                  placeholderTextColor={Colors.textLight}
                />
              </View>
            </View>
            <View className="mb-5">
              <Text className="text-sm font-semibold text-white mb-2">{t("auth.lastName")}</Text>
              <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
                <User size={18} color={Colors.textLight} />
                <TextInput
                  className="flex-1 py-4 pl-3 text-base text-white"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder={t("auth.enterLastName")}
                  placeholderTextColor={Colors.textLight}
                />
              </View>
            </View>
            <View className="mb-5">
              <Text className="text-sm font-semibold text-white mb-2">{t("auth.phone")}</Text>
              <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
                <Phone size={18} color={Colors.textLight} />
                <TextInput
                  className="flex-1 py-4 pl-3 text-base text-white"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={t("auth.enterPhone")}
                  placeholderTextColor={Colors.textLight}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            <View className="mb-5">
              <Text className="text-sm font-semibold text-white mb-2">{t("auth.emailAddress")}</Text>
              <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
                <Mail size={18} color={Colors.textLight} />
                <TextInput
                  className="flex-1 py-4 pl-3 text-base text-white"
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t("auth.enterEmail")}
                  placeholderTextColor={Colors.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </>
        )}
        {isLogin && (
          <View className="mb-5">
            <Text className="text-sm font-semibold text-white mb-2">{t("auth.emailAddress")}</Text>
            <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
              <Mail size={18} color={Colors.textLight} />
              <TextInput
                className="flex-1 py-4 pl-3 text-base text-white"
                value={email}
                onChangeText={setEmail}
                placeholder={t("auth.enterEmail")}
                placeholderTextColor={Colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        )}
        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">{t("auth.password")}</Text>
          <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
            <Lock size={18} color={Colors.textLight} />
            <TextInput
              className="flex-1 py-4 pl-3 text-base text-white"
              value={password}
              onChangeText={setPassword}
              placeholder={t("auth.enterPassword")}
              placeholderTextColor={Colors.textLight}
              secureTextEntry
            />
          </View>
          {isLogin && (
            <TouchableOpacity
              className="mt-2 self-end"
              onPress={() => router.push("/auth/forgot-password")}
            >
              <Text className="text-sm text-rm-gold underline">{t("auth.forgotPasswordTitle")}</Text>
            </TouchableOpacity>
          )}
        </View>
        {isLoading && <Spinner content={isLogin ? t("auth.signIn") : t("auth.signUp")} />}
        {!isLoading && (
          <>
            <TouchableOpacity
              className="bg-rm-gold p-4 rounded-[25px] items-center mt-2"
              onPress={handleSubmit}
            >
              <Text className="text-base font-bold text-white">
                {isLogin ? t("auth.login") : t("auth.register")}
              </Text>
            </TouchableOpacity>

            {isLogin && (
              <>
                <View className="flex-row items-center my-6">
                  <View className="flex-1 h-[1px] bg-border-light" />
                  <Text className="mx-4 text-text-secondary text-sm">{t("common.or")}</Text>
                  <View className="flex-1 h-[1px] bg-border-light" />
                </View>

                <TouchableOpacity
                  className="bg-white p-4 rounded-[25px] items-center flex-row justify-center gap-3 border-2 border-border-light"
                  onPress={handleGoogleSignIn}
                >
                  <FontAwesome name="google" size={24} color={Colors.text.dark} />
                  <Text className="text-base font-bold text-text-dark">
                    {t("auth.signInWithGoogle")}
                  </Text>
                </TouchableOpacity>

                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={25}
                  style={{ width: "100%", height: 52, marginTop: 12 }}
                  onPress={() => signInWithApple()}
                />
              </>
            )}
          </>
        )}

        <TouchableOpacity
          className="mt-4 items-center"
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text className="text-sm text-rm-gold underline">
            {isLogin ? t("auth.noAccountRegister") : t("auth.haveAccountLogin")}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

