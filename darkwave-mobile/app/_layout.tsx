import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0a0a' }
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}
