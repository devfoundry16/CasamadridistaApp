import { sendContactEmail } from "@/services/EmailService";
import { Link } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

export default function ContactScreen() {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [comment, setComment] = useState<string>("");

  const handleSubmit = async () => {
    if (!firstName.trim() || !email.trim() || !comment.trim()) {
      Alert.alert(
        "Missing Information",
        "Please fill in your name, email, and comment."
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      await sendContactEmail({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        comment: comment.trim(),
      });
      Alert.alert("Success", "Your message has been sent successfully!");
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setComment("");
    } catch (error: unknown) {
      console.error("Error sending email:", error);
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      Alert.alert(
        "Error",
        message || "Failed to send email. Please try again."
      );
    }
  };

  return (
    <>
      <ScrollView className="flex-1 bg-bg-medium" showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={{
            uri: "https://casamadridista.com/wp-content/uploads/2025/05/img3.png",
          }}
          className="h-[250px] justify-center items-center"
          imageStyle={{ opacity: 0.3 }}
        >
          <View className="items-center">
            <Text className="text-4xl font-bold text-white mb-3">Contact</Text>
            <View className="flex-row items-center">
              <Link href="/" className="no-underline">
                <Text className="text-sm text-rm-gold">Home</Text>
              </Link>
              <Text className="text-sm text-white"> / </Text>
              <Text className="text-sm text-white">Contact</Text>
            </View>
          </View>
        </ImageBackground>

        <View className="p-5">
          <View className="flex-row gap-10 flex-wrap">
            <View className="flex-1 min-w-[300px]">
              <Text className="text-[26px] font-bold text-white mb-4 leading-10">
                Your Voice Matters - Contact Us
              </Text>
              <Text className="text-[15px] text-text-tertiary leading-6 mb-0">
                Have questions, suggestions, or partnership ideas? We&apos;d
                love to hear from you! Fill out the form below and we&apos;ll
                get back to you as soon as possible.
              </Text>
              <Image
                source={{
                  uri: "https://casamadridista.com/wp-content/uploads/2025/09/4353454353.webp",
                }}
                style={{ width: screenWidth - 48, height: 300 }}
                resizeMode="contain"
              />
            </View>

            <View className="flex-1 min-w-[300px] bg-bg-medium rounded-xl p-6">
              <View className="flex-row gap-4 mb-5">
                <View className="flex-1">
                  <Text className="text-sm text-white mb-2 font-medium">Your Name</Text>
                  <TextInput
                    className="bg-bg-light rounded px-4 py-3 text-sm text-white border border-border-light"
                    placeholder="Your Name"
                    placeholderTextColor="#666"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-white mb-2 font-medium">Last Name</Text>
                  <TextInput
                    className="bg-bg-light rounded px-4 py-3 text-sm text-white border border-border-light"
                    placeholder="Last Name"
                    placeholderTextColor="#666"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>

              <View className="flex-row gap-4 mb-5">
                <View className="flex-1">
                  <Text className="text-sm text-white mb-2 font-medium">Phone Number</Text>
                  <TextInput
                    className="bg-bg-light rounded px-4 py-3 text-sm text-white border border-border-light"
                    placeholder="Phone Number"
                    placeholderTextColor="#666"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-white mb-2 font-medium">Email</Text>
                  <TextInput
                    className="bg-bg-light rounded px-4 py-3 text-sm text-white border border-border-light"
                    placeholder="Email"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-sm text-white mb-2 font-medium">Comment</Text>
                <TextInput
                  className="bg-bg-light rounded px-4 py-3 text-sm text-white border border-border-light h-[120px] pt-3"
                  placeholder="Comment"
                  placeholderTextColor="#666"
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                className="bg-rm-gold rounded-md py-3.5 px-8 items-center self-start border-2 border-rm-gold"
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                <Text className="text-base font-semibold text-bg-deep-dark">Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
