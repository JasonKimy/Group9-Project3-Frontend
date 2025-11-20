import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="HomeScreen"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="DeckScreen"
        options={{
          title: 'Decks',
        }}
      />
      <Tabs.Screen
        name="CheckInScreen"
        options={{
          title: 'Check In',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
        }}
      />
      <Tabs.Screen
        name="models"
        options={{
          title: 'Models',
        }}
      />
    </Tabs>
  );
}
