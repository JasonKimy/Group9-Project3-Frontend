import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchCategories, fetchPlacesByCategory } from '../services/api';

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
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading challenges...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>This Week's Challenges</Text>
        <Text style={styles.subheader}>
          Explore {decks.reduce((sum, deck) => sum + deck.placeCount, 0)} amazing places
        </Text>
      </View>
      
      <FlatList
        data={decks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.deckCard}
            onPress={() => router.push(`/deck/${item.id}`)}
          >
            <View style={styles.deckHeader}>
              <Text style={styles.deckEmoji}>{getCategoryEmoji(item.category)}</Text>
              <View style={styles.deckInfo}>
                <Text style={styles.deckName}>{item.name}</Text>
                <Text style={styles.deckDescription}>{item.description}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  header: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    marginBottom: 8,
    color: '#333',
  },
  subheader: {
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  deckCard: { 
    padding: 20, 
    backgroundColor: '#fff', 
    marginVertical: 8, 
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  deckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deckEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  deckInfo: {
    flex: 1,
  },
  deckName: { 
    fontSize: 22, 
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  deckDescription: {
    fontSize: 14,
    color: '#666',
  },
  arrow: {
    fontSize: 32,
    color: '#c7c7cc',
    fontWeight: '300',
  },
});
