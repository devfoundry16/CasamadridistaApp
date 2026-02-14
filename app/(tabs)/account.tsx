import { Spinner } from "@/components/Spinner";
import Colors from "@/constants/colors";
import { useUser } from "@/hooks/useUser";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  Camera,
  Crown,
  LogOut,
  Settings,
  User,
  Wallet,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AccountScreen() {
  const { user, updateAvatar, logout, isLoading } = useUser();
  const [isLogin, setIsLogin] = useState(true);

  const handleChangePhoto = async () => {
    Alert.alert("Change Profile Photo", "Select an option", [
      {
        text: "Take Photo",
        onPress: async () => await pickImage("camera"),
      },
      {
        text: "Choose from Gallery",
        onPress: async () => await pickImage("gallery"),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const pickImage = async (source: "camera" | "gallery") => {
    // Request permissions
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Denied", "Please grant access to proceed.");
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

  const userName = user.profile?.first_name || user.email?.split('@')[0] || 'User';
  const avatarUrl = user.profile?.avatar_url;

  return (
    <ScrollView className="flex-1 bg-bg-medium">
      <View className="bg-bg-deep-dark p-6 items-center">
        <View className="items-center mb-6">
          <View className="mb-4">
            {isLoading && <Spinner content="Setting avatar" />}
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
            <Text className="text-white text-sm font-semibold">Change Photo</Text>
          </TouchableOpacity>
        </View>

        <View className="items-center">
          <Text className="text-2xl font-bold text-rm-gold mb-3">Welcome {userName}</Text>
          <Text className="text-sm text-text-secondary text-center leading-5">
            Here you can view your membership details, manage your subscription,
            and update your profile information.
          </Text>
        </View>
      </View>

      <View className="p-6">
        <Text className="text-lg font-bold text-text-secondary mb-4">Dashboard</Text>

        <TouchableOpacity
          className="flex-row items-center bg-rm-gold p-4 rounded-[25px] mb-3 gap-4"
          onPress={() => router.push("../account/wallet" as any)}
        >
          <Wallet size={24} color={Colors.darkBg} />
          <View className="flex-1 flex-row justify-between items-center">
            <Text className="text-base font-semibold text-text-dark">Wallet</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center bg-rm-gold p-4 rounded-[25px] mb-3 gap-4"
          onPress={() => router.push("../account/subscription" as any)}
        >
          <Crown size={24} color={Colors.darkBg} />
          <View className="flex-1 flex-row justify-between items-center">
            <Text className="text-base font-semibold text-text-dark">Subscription</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center bg-rm-gold p-4 rounded-[25px] mb-3 gap-4"
          onPress={() => router.push("../account/details" as any)}
        >
          <Settings size={24} color={Colors.darkBg} />
          <View className="flex-1 flex-row justify-between items-center">
            <Text className="text-base font-semibold text-text-dark">Account Details</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center bg-bg-light p-4 rounded-[25px] mb-3 gap-4 border border-status-error"
          onPress={() => {
            Alert.alert("Logout", "Are you sure you want to logout?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Logout",
                style: "destructive",
                onPress: logout,
              },
            ]);
          }}
        >
          <LogOut size={24} color={Colors.error} />
          <View className="flex-1 flex-row justify-between items-center">
            <Text className="text-base font-semibold text-status-error">Logout</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View className="mx-6 p-5 bg-bg-light rounded-xl border border-border-light border-dashed">
        <Text className="text-sm text-text-secondary leading-5 mb-3">
          Hello <Text className="font-bold text-white">{userName}</Text> (not{" "}
          <Text className="font-bold text-white">{userName}</Text>?{" "}
          <Text className="text-rm-gold underline" onPress={logout}>
            Log out
          </Text>
          )
        </Text>
      </View>
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
  const { login, register, isLoading } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async () => {
    if (isLogin) {
      if (!email || !password) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }
      login(email, password);
    } else {
      if (!email || !password || !firstName || !lastName) {
        Alert.alert("Error", "Please fill in all required fields");
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
    Alert.alert("Google Sign In", "Google Sign In functionality will be implemented here");
    // TODO: Implement Google Sign In with expo-auth-session or similar
  };

  return (
    <ScrollView className="flex-1 bg-bg-medium">
      <View className="p-8 items-center bg-bg-deep-dark">
        <Text className="text-[32px] font-bold text-rm-gold mb-2">
          {isLogin ? "Login" : "Register"}
        </Text>
        <Text className="text-base text-text-secondary">
          {isLogin ? "Welcome back!" : "Create your account"}
        </Text>
      </View>

      <View className="p-6">
        {!isLogin && (
          <>
            <View className="mb-5">
              <Text className="text-sm font-semibold text-white mb-2">First Name *</Text>
              <TextInput
                className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your first name"
                placeholderTextColor={Colors.darkGray}
              />
            </View>
            <View className="mb-5">
              <Text className="text-sm font-semibold text-white mb-2">Last Name *</Text>
              <TextInput
                className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter your last name"
                placeholderTextColor={Colors.darkGray}
              />
            </View>
            <View className="mb-5">
              <Text className="text-sm font-semibold text-white mb-2">Phone</Text>
              <TextInput
                className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white"
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor={Colors.darkGray}
                keyboardType="phone-pad"
              />
            </View>
            <View className="mb-5">
              <Text className="text-sm font-semibold text-white mb-2">Email Address *</Text>
              <TextInput
                className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={Colors.darkGray}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </>
        )}

        {isLogin && (
          <View className="mb-5">
            <Text className="text-sm font-semibold text-white mb-2">Email Address *</Text>
            <TextInput
              className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={Colors.darkGray}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              className="mt-2 self-end"
              onPress={() => router.push("/auth/forgot-password")}
            >
              <Text className="text-sm text-rm-gold underline">Forgot password?</Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">Password *</Text>
          <TextInput
            className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={Colors.darkGray}
            secureTextEntry
          />
        </View>

        {isLoading && <Spinner content={isLogin ? "Sign in" : "Sign up"} />}
        {!isLoading && (
          <>
            <TouchableOpacity 
              className="bg-rm-gold p-4 rounded-[25px] items-center mt-2"
              onPress={handleSubmit}
            >
              <Text className="text-base font-bold text-white">
                {isLogin ? "Login" : "Register"}
              </Text>
            </TouchableOpacity>

            {isLogin && (
              <>
                <View className="flex-row items-center my-6">
                  <View className="flex-1 h-[1px] bg-border-light" />
                  <Text className="mx-4 text-text-secondary text-sm">OR</Text>
                  <View className="flex-1 h-[1px] bg-border-light" />
                </View>

                <TouchableOpacity 
                  className="bg-white p-4 rounded-[25px] items-center flex-row justify-center gap-3 border-2 border-border-light"
                  onPress={handleGoogleSignIn}
                >
                  <Text className="text-2xl">G</Text>
                  <Text className="text-base font-bold text-text-dark">
                    Sign in with Google
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        <TouchableOpacity
          className="mt-4 items-center"
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text className="text-sm text-rm-gold underline">
            {isLogin
              ? "Don't have an account? Register"
              : "Already have an account? Login"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

