import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

// Match the theme from your screens
const COLORS = {
  darkBlue: '#15292E',   // Background primary dark
  tealDark: '#074047',   // Card background
  teal: '#108585',       // Accent text / subheaders
  mint: '#1DA27E',       // Main highlights / buttons
  white: '#fff',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.mint,      // Active tab color
        tabBarInactiveTintColor: COLORS.teal,    // Inactive tab color
        tabBarStyle: {
          backgroundColor: COLORS.darkBlue,      // Tab bar background
          borderTopColor: COLORS.tealDark,       // Top border
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
      <Tabs.Screen
        name="CheckInScreen"
        options={{
          title: 'Check In',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
