import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckIn, fetchPlaceById, getUserCheckIns, Place, User } from '../services/api';

const COLORS = {
  darkBlue: '#15292E',
  tealDark: '#074047',
  teal: '#108585',
  mint: '#1DA27E',
  white: '#fff',
};

interface CheckInWithPlace extends CheckIn {
  place?: Place;
}

export default function VisitedPlacesScreen() {
  const [checkIns, setCheckIns] = useState<CheckInWithPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadCheckIns();
  }, []);

  const loadCheckIns = async () => {
    try {
      // Get current user from AsyncStorage
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) {
        console.log('No user found in storage');
        setCheckIns([]);
        return;
      }

      const user: User = JSON.parse(userJson);
      if (!user.id) {
        console.log('User has no ID');
        setCheckIns([]);
        return;
      }

      // Fetch user's check-ins from the backend
      const userCheckIns = await getUserCheckIns(user.id);

      // Fetch place details for each check-in
      const checkInsWithPlaces = await Promise.all(
        userCheckIns.map(async (checkIn) => {
          try {
            const place = await fetchPlaceById(checkIn.placeId);
            return { ...checkIn, place };
          } catch (err) {
            console.error(`Error fetching place ${checkIn.placeId}:`, err);
            return checkIn;
          }
        })
      );

      setCheckIns(checkInsWithPlaces);
    } catch (err) {
      console.error('Error loading check-ins:', err);
      Alert.alert('Error', 'Failed to load visited places. Please try again.');
      setCheckIns([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCheckIns();
  };

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}
  };

  const formatCategoryName = (category: string): string => {
    return category
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.mint} />
        <Text style={styles.loadingText}>Loading your visited places...</Text>
      </View>
    );
  }

  if (checkIns.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.appTitle}>WANDER</Text>
          <Text style={styles.header}>My Visits</Text>
          <Text style={styles.subheader}>Track your adventures</Text>
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📍</Text>
          <Text style={styles.emptyText}>No visits yet!</Text>
          <Text style={styles.emptySubtext}>
            Start exploring and checking in to places to build your collection.
          </Text>

          <TouchableOpacity 
            style={styles.exploreButton} 
            onPress={() => router.push('/(tabs)/HomeScreen')}
          >
            <Text style={styles.exploreButtonText}>Explore Challenges</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.headerContainer}>
        <Text style={styles.appTitle}>WANDER</Text>
        <Text style={styles.header}>My Visits</Text>
        <Text style={styles.subheader}>{checkIns.length} places visited</Text>
      </View>

      <FlatList
        data={checkIns}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.checkInCard}
            onPress={() => item.place && router.push(`/checkin/${item.placeId}`)}
          >
            {item.photoUri && (
              <Image 
                source={{ uri: item.photoUri }} 
                style={styles.checkInPhoto}
                resizeMode="cover"
              />
            )}

            <View style={styles.checkInContent}>
              <View style={styles.checkInHeader}>
                <View style={styles.checkInInfo}>
                  <Text style={styles.placeName}>
                    {item.place?.name || 'Unknown Place'}
                  </Text>

                  {item.place && (
                    <>
                    <Text style={styles.placeCategory}>
                      {formatCategoryName(item.place.category)} • {item.place.city}
                    </Text>
                    </>
                  )}
                </View>

                <View style={styles.timestampBadge}>
                  <Text style={styles.timestampText}>{formatDate(item.timestamp)}</Text>
                </View>
              </View>

              {item.place?.description && (
                <Text style={styles.placeDescription} numberOfLines={2}>
                  {item.place.description}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.mint}
            colors={[COLORS.mint]}
          />
        }
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
    padding: 28,
    paddingTop: 70,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.teal,
    alignItems: 'center',
  },

  appTitle: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 3,
    color: COLORS.mint,
    marginBottom: 10,
    textShadowColor: 'rgba(122,215,195,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },

  header: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 4,
    color: COLORS.mint,
  },

  subheader: {
    fontSize: 16,
    color: COLORS.teal,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },

  emptyEmoji: {
    fontSize: 70,
    marginBottom: 18,
  },

  emptyText: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 6,
  },

  emptySubtext: {
    fontSize: 16,
    color: COLORS.teal,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },

  exploreButton: {
    backgroundColor: COLORS.mint,
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: COLORS.mint,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },

  exploreButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },

  listContent: {
    padding: 18,
  },

  checkInCard: {
    backgroundColor: COLORS.tealDark,
    borderRadius: 20,
    marginBottom: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },

  checkInPhoto: {
    width: '100%',
    height: 220,
    backgroundColor: COLORS.teal,
  },

  checkInContent: {
    padding: 18,
  },

  checkInHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  checkInInfo: {
    flex: 1,
    marginRight: 12,
  },

  placeName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.mint,
    marginBottom: 4,
  },

  placeCategory: {
    fontSize: 14,
    color: COLORS.teal,
    fontWeight: '500',
  },

  timestampBadge: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },

  timestampText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '700',
  },

  placeDescription: {
    fontSize: 15,
    color: COLORS.white,
    opacity: 0.85,
    lineHeight: 21,
    marginTop: 6,
  },
});
