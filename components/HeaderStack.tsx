import Colors from '@/constants/colors';
import { Stack } from 'expo-router';
const HeaderStack = ({title}: {title: string}) => {
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
      }}
    />
  );
};

export default HeaderStack;