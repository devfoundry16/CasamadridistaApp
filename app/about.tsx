import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Check,
  FileText,
  Globe,
  Mail,
  Shield,
  Volleyball,
} from "lucide-react-native";
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

export default function AboutScreen() {
  const router = useRouter();

  return (
    <>
      <ScrollView className="flex-1 bg-bg-medium" showsVerticalScrollIndicator={false}>
        <View className="flex-col items-center justify-center">
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/324242342.webp",
            }}
            style={{ width: screenWidth, height: 250 }}
            className="mb-3"
            contentFit="cover"
          />
          <View className="absolute items-center">
            <Text className="text-4xl font-bold text-white mb-1">About Us</Text>
            <Text className="text-xl font-semibold text-rm-gold">بيت المدريديستا</Text>
          </View>
        </View>

        <View className="p-4">
          <View className="p-5 mb-4">
            <Text className="text-3xl font-bold text-rm-gold mb-3">Casa Madridista</Text>
            <Text className="text-[15px] text-white leading-6 mb-3">
              Casa Madridista is more than just a website it is the digital home
              of every passionate Madridista around the world. We are an
              official fan network, proudly uniting Real Madrid fan clubs from
              more than 30 countries under one banner.
            </Text>
            <Text className="text-[15px] text-white leading-6 mb-3">
              Driven by loyalty, history, and the legacy of greatness, our
              mission is to create a shared space for fans to connect,
              celebrate, and participate in the Real Madrid journey wherever
              they are in the world.
            </Text>
            <Image
              source={{
                uri: "https://casamadridista.com/wp-content/uploads/2025/09/436456.webp",
              }}
              style={{ width: screenWidth - 32, height: 305, borderRadius: 12 }}
              className="mt-3 mb-3"
              contentFit="cover"
            />
          </View>

          <View className="p-5 mb-4">
            <Text className="text-3xl font-bold text-rm-gold mb-3">Our Vision</Text>
            <Text className="text-[15px] text-white leading-6 mb-3">
              To unite Madridistas from all corners of the globe from every
              culture, background, and belief and create the most vibrant,
              trusted, and inclusive community of Real Madrid fans. We aim to
              amplify the voice of every fan, giving them a platform to connect,
              celebrate, and influence the official fan journey wherever they
              are in the world.
            </Text>
            <Image
              source={{
                uri: "https://casamadridista.com/wp-content/uploads/2025/09/5466456-1.webp",
              }}
              style={{ width: screenWidth - 32, height: 208, borderRadius: 12 }}
              className="mt-3 mb-3"
              contentFit="cover"
            />
          </View>

          <View className="p-5 mb-4">
            <Text className="text-3xl font-bold text-rm-gold mb-3">What We Offer</Text>
            <View className="flex-row items-center mb-3 gap-3">
              <Check size={20} color="#BC9045" strokeWidth={5} />
              <Text className="flex-1 text-sm text-white leading-[22px]">
                <Text className="font-bold text-white">Verified Membership Tiers</Text>{" "}
                that unlock exclusive content, VIP experiences, and official
                perks.
              </Text>
            </View>
            <View className="flex-row items-center mb-3 gap-3">
              <Check size={20} color="#BC9045" strokeWidth={5} />
              <Text className="flex-1 text-sm text-white leading-[22px]">
                <Text className="font-bold text-white">Access to Tickets & Events</Text>{" "}
                through our club allocations and special raffles.
              </Text>
            </View>
            <View className="flex-row items-center mb-3 gap-3">
              <Check size={20} color="#BC9045" strokeWidth={5} />
              <Text className="flex-1 text-sm text-white leading-[22px]">
                <Text className="font-bold text-white">
                  Interactive Fan Engagement,
                </Text>{" "}
                including polls, match previews, tactical discussions, and more.
              </Text>
            </View>
            <View className="flex-row items-center mb-3 gap-3">
              <Check size={20} color="#BC9045" strokeWidth={5} />
              <Text className="flex-1 text-sm text-white leading-[22px]">
                <Text className="font-bold text-white">
                  Private WhatsApp Channels & Live Sessions{" "}
                </Text>{" "}
                with analysts and community leaders.
              </Text>
            </View>
            <View className="flex-row items-center mb-3 gap-3">
              <Check size={20} color="#BC9045" strokeWidth={5} />
              <Text className="flex-1 text-sm text-white leading-[22px]">
                <Text className="font-bold text-white">A Place at the Table - </Text>{" "}
                VIP members can vote and take part in official fan club
                decisions.
              </Text>
            </View>
          </View>

          <View className="flex-col gap-3 mb-4">
            <View className="flex-1 min-w-[45%] p-4 items-center">
              <View className="w-[60px] h-[60px] justify-center items-center">
                <Volleyball
                  size={50}
                  strokeWidth={1.5}
                  color="#BC9045"
                />
              </View>
              <Text className="text-3xl font-bold text-rm-gold mb-3">Why We Exist</Text>
              <Text className="text-[15px] text-text-primary leading-6 text-center">
                Real Madrid is not just a football club. It&apos;s a story. A
                legacy. A force. We believe every fan deserves to be part of
                that story not just as a spectator, but as a participant.
              </Text>
            </View>

            <View className="flex-1 min-w-[45%] p-4 items-center">
              <View className="w-[60px] h-[60px] justify-center items-center">
                <Globe size={50} strokeWidth={1.5} color="#BC9045" />
              </View>
              <Text className="text-3xl font-bold text-rm-gold mb-3">A Global Family</Text>
              <Text className="text-[15px] text-text-primary leading-6 text-center">
                Whether you&apos;re in Madrid, Morocco, Mexico, or Malaysia you
                are part of One Madridista Family. Our strength lies in our
                unity, and our voice becomes louder with every member who joins.
              </Text>
            </View>
            <Text className="text-white text-lg text-center mt-2 font-medium italic">
              Casa Madridista is your chance to live that experience fully.
            </Text>
          </View>

          <View className="flex-col items-center justify-center">
            <Image
              source={{
                uri: "https://casamadridista.com/wp-content/uploads/2025/09/4234234234.webp",
              }}
              style={{ width: screenWidth, height: 350 }}
              contentFit="cover"
            />
            <View className="absolute items-center">
              <Text className="text-3xl font-bold text-rm-gold mb-3">Join Us</Text>
              <View className="flex-col items-center mb-3 gap-3">
                <Text className="text-text-secondary text-center text-[13px] mb-0">
                  Become an official member, access exclusive content, and
                  represent Real Madrid with pride.
                </Text>
                <Text className="text-text-secondary text-center italic text-[15px] mb-0">
                  For collaborations, media, or official inquiries
                </Text>
                <Mail size={30} color="#BC9045" strokeWidth={3} />
                <Text className="text-[15px] text-white leading-6 mb-3">
                  Contact@casamadridista.com
                </Text>
              </View>
            </View>
          </View>

          <View className="p-5 mb-4">
            <Text className="text-3xl font-bold text-rm-gold mb-3">Legal</Text>
            <TouchableOpacity
              className="flex-row items-center p-4 mb-3"
              onPress={() => router.push("/terms-of-service")}
            >
              <View className="justify-center items-center mr-5">
                <FileText size={35} color="#BC9045" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-white mb-1">Terms of Service</Text>
                <Text className="text-[13px] text-white">
                  Read our terms and conditions
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center p-4 mb-3"
              onPress={() => router.push("/privacy-policy")}
            >
              <View className="justify-center items-center mr-5">
                <Shield size={35} color="#BC9045" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-white mb-1">Privacy Policy</Text>
                <Text className="text-[13px] text-white">
                  Learn how we protect your data
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
