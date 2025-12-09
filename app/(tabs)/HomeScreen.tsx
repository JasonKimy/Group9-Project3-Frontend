import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View, Image, ScrollView } from 'react-native';
import { getUserDecks, User, Deck, getFriendsWithDecks, FriendWithDecks } from '../services/api';

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
        <View style={styles.headerContainer}>
          <Text style={styles.header}>This Week's Challenges</Text>
          <Text style={styles.subheader}>
            Explore {decks.reduce((sum, deck) => sum + deck.places.length, 0)} amazing places
          </Text>
        </View>
        
        <View style={styles.listContent}>
          {decks.map((item) => (
            <TouchableOpacity
              key={item.id.toString()}
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
          ))}
        </View>

        {friendsWithDecks.length > 0 && (
          <>
            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionHeader}>Friends' Decks</Text>
              <Text style={styles.subheader}>
                See what your friends are exploring
              </Text>
            </View>
            
            <View style={styles.listContent}>
              {friendsWithDecks.map((friend) => {
                // Show only the first deck from each friend
                const deck = friend.decks[0];
                if (!deck) return null;
                
                return (
                  <TouchableOpacity
                    key={`${friend.id}-${deck.id}`}
                    style={styles.deckCard}
                    onPress={() => router.push(`/deck/${deck.id}`)}
                  >
                    <View style={styles.deckHeader}>
                      <Text style={styles.deckEmoji}>{getCategoryEmoji(deck.category)}</Text>
                      <View style={styles.deckInfo}>
                        <Text style={styles.deckName}>{formatCategoryName(deck.category)}</Text>
                        <Text style={styles.deckDescription}>
                          {friend.username}'s deck • {deck.places.length} place{deck.places.length !== 1 ? 's' : ''}
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
      </ScrollView>
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
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: COLORS.mint,
  },
});
