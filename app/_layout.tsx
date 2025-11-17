import { Stack } from 'expo-router';

export default function RootLayout() {
  // Hide the automatic header on all screens
  return <Stack screenOptions={{ headerShown: false }} />;
}
