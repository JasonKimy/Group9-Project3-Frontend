import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

const COLORS = {
  darkBlue: '#15292E',
  tealDark: '#074047',
  teal: '#108585',
  mint: '#1DA27E',
  white: '#fff',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.mint,
        tabBarInactiveTintColor: COLORS.teal,
        tabBarStyle: {
          backgroundColor: COLORS.darkBlue,
          borderTopColor: COLORS.tealDark,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="HomeScreen"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="DeckScreen"
        options={{
          title: 'Decks',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
