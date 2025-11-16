import Colors from "@/constants/colors";
import { Stack, router } from "expo-router";
import { Text, TouchableOpacity } from "react-native";
export const headerOptions = {
  headerShown: true,
  headerBackButtonDisplayMode: "minimal" as const,
  headerTintColor: Colors.textWhite,
  headerStyle: { backgroundColor: Colors.darkGold },
  headerTitleStyle: { fontWeight: "700" as const },
};
const HeaderStack = ({ title }: { title: string }) => {
  return (
    <Stack.Screen
      options={{
        headerTitle: title,
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: Colors.secondary,
        },
        headerTintColor: Colors.textWhite,
        headerTitleStyle: {
          fontWeight: "700" as const,
        },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <Text
              style={{
                color: Colors.lightGray,
                fontSize: 16,
                marginHorizontal: 8,
              }}
            >
              Back
            </Text>
          </TouchableOpacity>
        ),
      }}
    />
  );
};

export default HeaderStack;
