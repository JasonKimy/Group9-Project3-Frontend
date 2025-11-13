// Home page for Wander
// app/(tabs)/home.tsx
//Features added:
//Fun banner welcoming the user.
//Points card at the top (currently 0).
//Horizontal scroll of weekly themed decks (2–5 decks).
//Deck colors match your Wander palette.
//Comments for teammates explaining sections.
//Placeholder logic for backend / weather + location.

// Home page for Wander (dark theme)
// app/(tabs)/home.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

// Interface for a weekly challenge deck
interface Deck {
  id: string;
  name: string;
  theme: string;
  places: { id: string; name: string }[];
  color: string;
}

const COLORS = {
  darkBlue: '#15292E',
  tealDark: '#074047',
  teal: '#108585',
  mint: '#1DA27E',
  white: '#fff',
};

export default function HomeScreen() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [points, setPoints] = useState(0); // user's accumulated points
  const router = useRouter();

  useEffect(() => {
    // Mock weekly decks (replace with backend + weather/location)
    const mockDecks: Deck[] = [
      { id: '1', name: 'Coffee Shops', theme: 'Coffee Shops', places: [{ id: 'a', name: 'Starbucks' }], color: COLORS.teal },
      { id: '2', name: 'Hiking Trails', theme: 'Hiking Trails', places: [{ id: 'b', name: 'Sunny Trail' }], color: COLORS.mint },
      { id: '3', name: 'Restaurants', theme: 'Restaurants', places: [{ id: 'c', name: 'Taco Place' }], color: COLORS.tealDark },
      { id: '4', name: 'Gyms', theme: 'Gyms', places: [{ id: 'd', name: 'Fit Gym' }], color: COLORS.teal },
    ];
    setDecks(mockDecks.slice(0, 4)); // pick 2-5 decks
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Let's Wander!</Text>
        <Text style={styles.bannerSubText}>Explore your city and earn points!</Text>
      </View>

      {/* Points Card */}
      <View style={styles.pointsCard}>
        <Text style={styles.pointsLabel}>Your Points</Text>
        <Text style={styles.pointsValue}>{points}</Text>
      </View>

      {/* Weekly Decks */}
      <Text style={styles.sectionTitle}>This Week’s Challenges</Text>
      <FlatList
        data={decks}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.deckCard, { backgroundColor: item.color }]}
            onPress={() => router.push(`/home/DeckScreen?deckId=${item.id}`)}
          >
            <Text style={styles.deckName}>{item.name}</Text>
            <Text style={styles.deckTheme}>{item.theme}</Text>
            <Text style={styles.deckPlaces}>{item.places.length} places</Text>
          </TouchableOpacity>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: COLORS.darkBlue, // dark background like login page
  },
  banner: {
    backgroundColor: COLORS.teal,
    padding: 20,
    borderRadius: 15,
    marginHorizontal: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  bannerText: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: 'bold',
  },
  bannerSubText: {
    color: '#d0f0ed',
    fontSize: 16,
    marginTop: 5,
  },
  pointsCard: {
    backgroundColor: COLORS.tealDark,
    marginHorizontal: 16,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  pointsLabel: {
    color: COLORS.white,
    fontSize: 16,
  },
  pointsValue: {
    color: COLORS.mint,
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  deckCard: {
    width: 180,
    padding: 16,
    borderRadius: 15,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  deckName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  deckTheme: {
    fontSize: 14,
    color: '#e0f7f5',
    marginTop: 5,
  },
  deckPlaces: {
    fontSize: 14,
    color: COLORS.white,
    marginTop: 10,
  },
});
