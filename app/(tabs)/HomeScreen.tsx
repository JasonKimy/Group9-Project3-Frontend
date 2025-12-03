import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getUserDecks, User, Deck } from '../services/api';

//color palette
const COLORS = {
  darkBlue: '#15292E',   // Background primary dark
  tealDark: '#074047',   // Card background
  teal: '#108585',       // Accent text / subheaders
  mint: '#1DA27E',       // Main highlights / buttons
  white: '#fff',
};

export default function HomeScreen() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadDecks = async () => {
    try {
      // Get current user from AsyncStorage
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) {
        console.log('No user found in storage');
        setDecks([]);
        return;
      }

      const user: User = JSON.parse(userJson);
      if (!user.id) {
        console.log('User has no ID');
        setDecks([]);
        return;
      }

      // Fetch user's decks from the backend
      const userDecks = await getUserDecks(user.id);
      setDecks(userDecks);
    } catch (err) {
      console.error('Error loading decks:', err);
      setDecks([]);
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
          Explore {decks.reduce((sum, deck) => sum + deck.places.length, 0)} amazing places
        </Text>
      </View>
      
      <FlatList
        data={decks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.deckCard}
            onPress={() => router.push(`/deck/${item.id}`)}
          >
            <View style={styles.deckHeader}>
              <Text style={styles.deckEmoji}>{getCategoryEmoji(item.category)}</Text>
              <View style={styles.deckInfo}>
                <Text style={styles.deckName}>{formatCategoryName(item.category)}</Text>
                <Text style={styles.deckDescription}>
                  {getCategoryDescription(item.category, item.places.length)}
                </Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </View>
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
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
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
  headerContainer: {
    backgroundColor: COLORS.tealDark,
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.teal,
  },
  header: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    marginBottom: 8,
    color: COLORS.mint,
  },
  subheader: {
    fontSize: 16,
    color: COLORS.teal,
  },
  listContent: {
    padding: 16,
  },
  deckCard: { 
    padding: 20, 
    backgroundColor: COLORS.tealDark, 
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
    color: COLORS.mint,
  },
  deckDescription: {
    fontSize: 14,
    color: COLORS.white,
  },
  arrow: {
    fontSize: 32,
    color: COLORS.mint,
    fontWeight: '300',
  },
});
