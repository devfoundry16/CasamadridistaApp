import Colors from "@/constants/colors";
import { Stack, router } from "expo-router";
import { Text, TouchableOpacity } from "react-native";

const HeaderStack = ({ title }: { title: string }) => {
  return (
    <Stack.Screen
      options={{
        headerTitle: title,
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
