import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0a0a0a'
          },
          headerTintColor: '#00d9ff',
          headerTitleStyle: {
            fontWeight: 'bold',
            color: '#fff'
          },
          cardStyle: { backgroundColor: '#0a0a0a' }
        }}
      >
        <Stack.Screen name="index" options={{ title: 'DarkWave Pulse' }} />
      </Stack>
    </View>
  );
}
