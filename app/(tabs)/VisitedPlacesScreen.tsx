import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckIn, fetchPlaceById, getUserCheckIns, Place, User } from '../services/api';
import MorphingLoadingScreen from '../components/MorphingLoadingScreen';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  darkBlue: '#15292E',
  tealDark: '#074047',
  teal: '#108585',
  mint: '#1DA27E',
  white: '#fff',
};

const COOLDOWN_HOURS = 4;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

interface CheckInWithPlace extends CheckIn {
  place?: Place;
}

interface PlaceVisitInfo {
  placeId: string;
  place?: Place;
  level: number;
  lastCheckIn: CheckIn;
  cooldownRemaining: number | null;
  canCheckIn: boolean;
}

export default function VisitedPlacesScreen() {
  const [placeVisits, setPlaceVisits] = useState<PlaceVisitInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const router = useRouter();

  useEffect(() => {
    loadCheckIns();
    
    // Update timer every minute
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const loadCheckIns = async () => {
    try {
      // Get current user from AsyncStorage
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) {
        console.log('No user found in storage');
        setPlaceVisits([]);
        return;
      }

      const user: User = JSON.parse(userJson);
      if (!user.id) {
        console.log('User has no ID');
        setPlaceVisits([]);
        return;
      }

      // Fetch user's check-ins from the backend
      const userCheckIns = await getUserCheckIns(user.id);

      // Group check-ins by place
      const placeMap = new Map<string, CheckIn[]>();
      userCheckIns.forEach(checkIn => {
        if (!placeMap.has(checkIn.placeId)) {
          placeMap.set(checkIn.placeId, []);
        }
        placeMap.get(checkIn.placeId)!.push(checkIn);
      });

      // Create PlaceVisitInfo for each unique place
      const visitInfoPromises = Array.from(placeMap.entries()).map(async ([placeId, checkIns]) => {
        // Sort by timestamp to get the most recent
        checkIns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const lastCheckIn = checkIns[0];
        const level = checkIns.length;

        // Calculate cooldown
        const lastCheckInTime = new Date(lastCheckIn.timestamp).getTime();
        const timeSinceLastCheckIn = Date.now() - lastCheckInTime;
        const cooldownRemaining = COOLDOWN_MS - timeSinceLastCheckIn;
        const canCheckIn = cooldownRemaining <= 0;

        // Fetch place details
        let place: Place | undefined;
        try {
          place = await fetchPlaceById(placeId);
        } catch (err) {
          console.error(`Error fetching place ${placeId}:`, err);
        }

        return {
          placeId,
          place,
          level,
          lastCheckIn,
          cooldownRemaining: canCheckIn ? null : cooldownRemaining,
          canCheckIn,
        };
      });

      const visitInfo = await Promise.all(visitInfoPromises);
      
      // Sort by most recent check-in
      visitInfo.sort((a, b) => 
        new Date(b.lastCheckIn.timestamp).getTime() - new Date(a.lastCheckIn.timestamp).getTime()
      );

      setPlaceVisits(visitInfo);
    } catch (err) {
      console.error('Error loading check-ins:', err);
      Alert.alert('Error', 'Failed to load visited places. Please try again.');
      setPlaceVisits([]);
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

  const formatCooldown = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (placeVisits.length === 0) {
    return (
      <>
        <MorphingLoadingScreen visible={loading} />
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
      </>
    );
  }

  return (
    <>
      <MorphingLoadingScreen visible={loading} />
      <View style={styles.container}>

      <View style={styles.headerContainer}>
        <Text style={styles.appTitle}>WANDER</Text>
        <Text style={styles.header}>My Visits</Text>
        <Text style={styles.subheader}>{placeVisits.length} places visited</Text>
      </View>

      <FlatList
        data={placeVisits}
        keyExtractor={(item) => item.placeId}
        renderItem={({ item }) => {
          // Recalculate cooldown based on current time
          const lastCheckInTime = new Date(item.lastCheckIn.timestamp).getTime();
          const timeSinceLastCheckIn = currentTime - lastCheckInTime;
          const cooldownRemaining = COOLDOWN_MS - timeSinceLastCheckIn;
          const canCheckIn = cooldownRemaining <= 0;

          return (
            <TouchableOpacity
              style={[styles.checkInCard, !canCheckIn && styles.cooldownCard]}
              onPress={() => item.place && canCheckIn && router.push(`/checkin/${item.placeId}`)}
              disabled={!canCheckIn}
              activeOpacity={canCheckIn ? 0.7 : 1}
            >
              {item.lastCheckIn.photoUri && (
                <Image 
                  source={{ uri: item.lastCheckIn.photoUri }} 
                  style={styles.checkInPhoto}
                  resizeMode="cover"
                />
              )}

              <View style={styles.checkInContent}>
                <View style={styles.checkInHeader}>
                  <View style={styles.checkInInfo}>
                    <View style={styles.placeNameRow}>
                      <Text style={[styles.placeName, !canCheckIn && styles.cooldownText]}>
                        {item.place?.name || 'Unknown Place'}
                      </Text>
                      <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>Level {item.level}</Text>
                      </View>
                    </View>

                    {item.place && (
                      <>
                        <Text style={[styles.placeCategory, !canCheckIn && styles.cooldownText]}>
                          {formatCategoryName(item.place.category)} • {item.place.city}
                        </Text>
                      </>
                    )}
                  </View>

                  <View style={styles.timestampBadge}>
                    <Text style={styles.timestampText}>{formatDate(item.lastCheckIn.timestamp)}</Text>
                  </View>
                </View>

                {item.place?.description && (
                  <Text style={[styles.placeDescription, !canCheckIn && styles.cooldownText]} numberOfLines={2}>
                    {item.place.description}
                  </Text>
                )}

                {!canCheckIn && (
                  <View style={styles.cooldownBanner}>
                    <Ionicons name="time-outline" size={18} color={COLORS.white} />
                    <Text style={styles.cooldownBannerText}>
                      Available in {formatCooldown(cooldownRemaining)}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
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
    </>
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

  cooldownCard: {
    backgroundColor: '#0a2327',
    opacity: 0.8,
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

  placeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },

  placeName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.mint,
    marginRight: 8,
  },

  levelBadge: {
    backgroundColor: COLORS.mint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  levelText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '700',
  },

  placeCategory: {
    fontSize: 14,
    color: COLORS.teal,
    fontWeight: '500',
  },

  cooldownText: {
    opacity: 0.6,
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

  cooldownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },

  cooldownBannerText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
  },
});
