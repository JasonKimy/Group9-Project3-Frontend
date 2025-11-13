import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchCategories, fetchPlacesByCategory } from '../services/api';

// Color palette for the Wander app
const COLORS = {
  darkBlue: '#15292E',  // Background primary dark
  tealDark: '#074047',  // Input background
  teal: '#108585',  // Accent color / links
  mint: '#1DA27E',  // Primary button color / highlights
  white: '#fff',    // Text color
};

interface Deck {
  id: string;
  name: string;
  category: string;
  placeCount: number;
  description: string;
}

export default function HomeScreen() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadDecks = async () => {
    try {
      const categories = await fetchCategories();
      
      const deckPromises = categories.map(async (category) => {
        try {
          const places = await fetchPlacesByCategory(category);
          return {
            id: category,
            name: formatCategoryName(category),
            category: category,
            placeCount: places.length,
            description: getCategoryDescription(category, places.length),
          };
        } catch (err) {
          console.error(`Error fetching places for ${category}:`, err);
          return null;
        }
      });

      const deckResults = await Promise.all(deckPromises);
      const validDecks = deckResults.filter((deck): deck is Deck => deck !== null && deck.placeCount > 0);
      validDecks.sort((a, b) => b.placeCount - a.placeCount);
      
      setDecks(validDecks);
    } catch (err) {
      console.error('Error loading decks:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDecks();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDecks();
  };

  const formatCategoryName = (category: string): string => {
    return category
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getCategoryDescription = (category: string, count: number): string => {
    const descriptions: { [key: string]: string } = {
      coffee_shop: 'Discover amazing coffee spots',
      restaurant: 'Explore delicious dining options',
      park: 'Visit beautiful outdoor spaces',
      beach: 'Find stunning coastal locations',
      museum: 'Experience art and culture',
      gym: 'Stay active at fitness centers',
      bar: 'Enjoy nightlife venues',
      cafe: 'Relax at cozy cafes',
    };
    
    const desc = descriptions[category] || `Explore local ${formatCategoryName(category).toLowerCase()}`;
    return `${desc} • ${count} place${count !== 1 ? 's' : ''}`;
  };

  const getCategoryEmoji = (category: string): string => {
    const emojis: { [key: string]: string } = {
      coffee_shop: '☕',
      restaurant: '🍽️',
      park: '🌳',
      beach: '🏖️',
      museum: '🎨',
      gym: '💪',
      bar: '🍺',
      cafe: '☕',
      hotel: '🏨',
      shopping: '🛍️',
    };
    return emojis[category] || '📍';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.mint} />
        <Text style={styles.loadingText}>Loading challenges...</Text>
      </View>
    );
  }

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
        <Text style={styles.pointsValue}>0</Text>
      </View>

      {/* Weekly Decks */}
      <Text style={styles.sectionTitle}>This Week's Challenges</Text>
      <FlatList
        data={decks}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.deckCard, { backgroundColor: COLORS.teal }]}
            onPress={() => router.push(`/deck/${item.id}`)}
          >
            <Text style={styles.deckEmoji}>{getCategoryEmoji(item.category)}</Text>
            <Text style={styles.deckName}>{item.name}</Text>
            <Text style={styles.deckTheme}>{item.description}</Text>
            <Text style={styles.deckPlaces}>{item.placeCount} places</Text>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.mint]}
            tintColor={COLORS.mint}
          />
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: COLORS.darkBlue,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.darkBlue,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.white,
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
  deckEmoji: {
    fontSize: 32,
    marginBottom: 8,
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
