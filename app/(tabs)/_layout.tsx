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
        name="VisitedPlacesScreen"
        options={{
          title: 'Visits',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="DeckScreen"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="CheckInScreen"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="models"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
