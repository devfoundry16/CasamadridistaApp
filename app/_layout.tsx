import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider } from '@/contexts/AppContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="create-formation" options={{ headerShown: true, headerTitle: 'Create Formation', headerStyle: { backgroundColor: '#001F3F' }, headerTintColor: '#FFFFFF', headerTitleStyle: { fontWeight: '700' as const } }} />
      <Stack.Screen name="team" options={{ headerShown: true, headerTitle: 'Team', headerStyle: { backgroundColor: '#001F3F' }, headerTintColor: '#FFFFFF', headerTitleStyle: { fontWeight: '700' as const } }} />
      <Stack.Screen name="store" options={{ headerShown: true, headerTitle: 'Store', headerStyle: { backgroundColor: '#001F3F' }, headerTintColor: '#FFFFFF', headerTitleStyle: { fontWeight: '700' as const } }} />
      <Stack.Screen
        name="article/[id]"
        options={{
          headerShown: true,
          headerTitle: 'Article',
          headerStyle: {
            backgroundColor: '#001F3F',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </AppProvider>
    </QueryClientProvider>
  );
}
