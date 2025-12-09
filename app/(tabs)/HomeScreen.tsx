import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Deck, FriendWithDecks, getFriendsWithDecks, getUserDecks, User } from '../services/api';

//color palette
const COLORS = {
  darkBlue: '#15292E',   // Background primary dark
  tealDark: '#074047',   // Card background
  teal: '#108585',       // Accent text / subheaders
  mint: '#1DA27E',       // Main highlights / buttons
  white: '#fff',
};

// Avatar categories - matching ProfileScreen
const AVATAR_CATEGORIES = {
  Normal: [
    require('../../assets/Wander-Avatars/Normal/normal1.png'),
    require('../../assets/Wander-Avatars/Normal/normal2.png'),
    require('../../assets/Wander-Avatars/Normal/normal3.png'),
    require('../../assets/Wander-Avatars/Normal/normal4.png'),
  ],
  Astro: [
    require('../../assets/Wander-Avatars/Astro/Astro1.png'),
    require('../../assets/Wander-Avatars/Astro/Astro2.png'),
    require('../../assets/Wander-Avatars/Astro/Astro3.png'),
    require('../../assets/Wander-Avatars/Astro/Astro4.png'),
  ],
  Cowboy: [
    require('../../assets/Wander-Avatars/Cowboy/Cowboy1.png'),
    require('../../assets/Wander-Avatars/Cowboy/Cowboy2.png'),
    require('../../assets/Wander-Avatars/Cowboy/Cowboy3.png'),
    require('../../assets/Wander-Avatars/Cowboy/Cowboy4.png'),
  ],
  KPOP: [
    require('../../assets/Wander-Avatars/KPOP/KPOP1.png'),
    require('../../assets/Wander-Avatars/KPOP/KPOP2.png'),
    require('../../assets/Wander-Avatars/KPOP/KPOP3.png'),
    require('../../assets/Wander-Avatars/KPOP/KPOP4.png'),
  ],
  Viking: [
    require('../../assets/Wander-Avatars/Viking/Viking1.png'),
    require('../../assets/Wander-Avatars/Viking/Viking2.png'),
    require('../../assets/Wander-Avatars/Viking/Viking3.png'),
    require('../../assets/Wander-Avatars/Viking/Viking4.png'),
  ],
};

type CategoryName = keyof typeof AVATAR_CATEGORIES;

// Get avatar image from path string
const getAvatarImage = (avatarPath?: string) => {
  if (!avatarPath) {
    return AVATAR_CATEGORIES.Normal[0];
  }

  // Parse path like "../assets/Wander-Avatars/Viking/Viking4.png"
  const match = avatarPath.match(/Wander-Avatars\/(\w+)\/(\w+)(\d+)\.png/);
  if (!match) {
    return AVATAR_CATEGORIES.Normal[0];
  }

  const [, category, , index] = match;
  const categoryKey = category as CategoryName;
  const imageIndex = parseInt(index) - 1; // Convert to 0-based index

  if (AVATAR_CATEGORIES[categoryKey] && AVATAR_CATEGORIES[categoryKey][imageIndex]) {
    return AVATAR_CATEGORIES[categoryKey][imageIndex];
  }

  return AVATAR_CATEGORIES.Normal[0];
};

export default function HomeScreen() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [friendsWithDecks, setFriendsWithDecks] = useState<FriendWithDecks[]>([]);
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
        setFriendsWithDecks([]);
        return;
      }

      const user: User = JSON.parse(userJson);
      if (!user.id) {
        console.log('User has no ID');
        setDecks([]);
        setFriendsWithDecks([]);
        return;
      }

      // Fetch user's decks and friends' decks from the backend
      const [userDecks, friends] = await Promise.all([
        getUserDecks(user.id),
        getFriendsWithDecks(user.id)
      ]);
      
      setDecks(userDecks);
      setFriendsWithDecks(friends);
    } catch (err) {
      console.error('Error loading decks:', err);
      setDecks([]);
      setFriendsWithDecks([]);
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

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.mint]}
            tintColor={COLORS.mint}
          />
        }
      >
        {/* CONTENT AREA */}
        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>This Week’s Challenges</Text>
          <Text style={styles.sectionSubtitle}>
            Explore {decks.reduce((sum, deck) => sum + deck.places.length, 0)} amazing places
          </Text>

          {/* Your decks, using finalized card styles */}
          <View style={styles.listContent}>
            {decks.map((item) => (
              <TouchableOpacity
                key={item.id.toString()}
                style={styles.card}
                onPress={() => router.push(`/deck/${item.id}`)}
                activeOpacity={0.8}
              >
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
            ))}
          </View>

          {/* Friends' Decks section from main, but using finalized card styles */}
          {friendsWithDecks.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Friends' Decks</Text>
              <Text style={styles.sectionSubtitle}>
                See what your friends are exploring
              </Text>

              <View style={styles.listContent}>
                {friendsWithDecks.map((friend) => {
                  const deck = friend.decks[0];
                  if (!deck) return null;

                  return (
                    <TouchableOpacity
                      key={`${friend.id}-${deck.id}`}
                      style={styles.card}
                      onPress={() => router.push(`/deck/${deck.id}`)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardEmoji}>{getCategoryEmoji(deck.category)}</Text>

                        <View style={styles.cardInfo}>
                          <Text style={styles.cardTitle}>{formatCategoryName(deck.category)}</Text>
                          <Text style={styles.cardDescription}>
                            {friend.username}'s deck • {deck.places.length} place
                            {deck.places.length !== 1 ? 's' : ''}
                          </Text>
                        </View>

                        <Image
                          source={getAvatarImage(friend.avatar_url)}
                          style={styles.friendAvatar}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>
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
  },
  sectionHeaderContainer: {
    backgroundColor: COLORS.tealDark,
    padding: 20,
    paddingTop: 30,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.teal,
  },
  sectionHeader: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.mint,
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
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: COLORS.mint,
  },
});
