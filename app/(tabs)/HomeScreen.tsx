import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  RefreshControl, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Animated 
} from 'react-native';
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
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

      // Smooth fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  };

  useEffect(() => {
    loadDecks();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDecks();
  };

  const formatCategoryName = (category: string): string =>
    category
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.mint} />
        <Text style={styles.loadingText}>Loading your experience...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* HERO HEADER */}
      <View style={styles.heroContainer}>
        <Text style={styles.heroTitle}>WANDER</Text>
        <Text style={styles.heroSubtitle}>Find your next adventure</Text>
      </View>

      {/* CONTENT AREA */}
      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
        <Text style={styles.sectionTitle}>This Week’s Challenges</Text>
        <Text style={styles.sectionSubtitle}>
          {decks.reduce((sum, deck) => sum + deck.places.length, 0)} curated experiences
        </Text>

        <FlatList
          data={decks}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.mint]}
              tintColor={COLORS.mint}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/deck/${item.id}`)}
              activeOpacity={0.8}
            >
              {/* CARD CONTENT */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardEmoji}>{getCategoryEmoji(item.category)}</Text>

                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{formatCategoryName(item.category)}</Text>
                  <Text style={styles.cardDescription}>
                    {getCategoryDescription(item.category, item.places.length)}
                  </Text>
                </View>

                <Text style={styles.cardArrow}>›</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBlue,
  },

  /* LOADING */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.darkBlue,
  },
  loadingText: { color: COLORS.white, marginTop: 12 },

  /* HERO SECTION */
  heroContainer: {
    paddingTop: 70,
    paddingBottom: 50,
    paddingHorizontal: 20,
    backgroundColor: COLORS.darkBlue,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.mint,
    letterSpacing: 3,
    textShadowColor: COLORS.teal,
    textShadowRadius: 10,
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.8,
  },

  /* CONTENT AREA */
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.tealDark,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.mint,
  },
  sectionSubtitle: {
    paddingHorizontal: 20,
    color: COLORS.teal,
    marginBottom: 10,
  },

  /* LIST & CARDS */
  listContent: { padding: 16 },

  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 18,
    marginVertical: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(29,162,126,0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  cardHeader: { flexDirection: 'row', alignItems: 'center' },

  cardEmoji: { fontSize: 36, marginRight: 16 },

  cardInfo: { flex: 1 },

  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  cardDescription: {
    color: COLORS.teal,
    fontSize: 14,
    marginTop: 4,
  },

  cardArrow: {
    fontSize: 34,
    color: COLORS.mint,
    fontWeight: '200',
  },
});
