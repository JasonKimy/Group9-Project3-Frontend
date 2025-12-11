import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculateDistance, getDeckById, Deck, Place, getUserCheckIns, User } from '../services/api';
import MorphingLoadingScreen from '../components/MorphingLoadingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KM_TO_MILES = 0.621371; // Conversion factor

const COLORS = {
  darkBlue: '#15292E',   // Background
  tealDark: '#074047',   // Cards
  teal: '#108585',       // Secondary text / accents
  mint: '#1DA27E',       // Highlights / buttons
  white: '#fff',
};

export default function DeckScreen() {
  const { deckId } = useLocalSearchParams() as { deckId: string };
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [visitedPlaceIds, setVisitedPlaceIds] = useState<Set<string>>(new Set());
  const [visitedPlacesLoaded, setVisitedPlacesLoaded] = useState(false);
  const [deckLoaded, setDeckLoaded] = useState(false);

  // Fetch user location and visited places
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Get user location for distance calculation
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          if (mounted) {
            setUserLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        }
      } catch (err) {
        console.warn('Could not get location:', err);
      }

      // Fetch user's check-ins to determine visited places
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const user: User = JSON.parse(userJson);
          if (user.id) {
            const checkIns = await getUserCheckIns(user.id);
            const visitedIds = new Set(checkIns.map(checkIn => checkIn.placeId));
            if (mounted) {
              setVisitedPlaceIds(visitedIds);
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch check-ins:', err);
      } finally {
        if (mounted) {
          setVisitedPlacesLoaded(true);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Fetch deck data
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Fetch the deck from backend
        const fetchedDeck = await getDeckById(Number(deckId));
        
        // Calculate distances if user location is available
        const placesWithDistance = fetchedDeck.places.map((place) => {
          if (userLocation) {
            const distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              place.lat,
              place.lon
            );
            return { ...place, distance };
          }
          return place;
        });

        // Sort by distance if available
        if (userLocation) {
          placesWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }

        if (mounted) {
          setDeck({
            ...fetchedDeck,
            places: placesWithDistance,
          });
        }
      } catch (err) {
        console.error('Error fetching deck:', err);
        if (mounted) {
          Alert.alert('Error', 'Failed to load deck. Please try again.');
        }
      } finally {
        if (mounted) {
          setDeckLoaded(true);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [deckId, userLocation]);

  // Update loading state when both deck and visited places are loaded
  useEffect(() => {
    if (deckLoaded && visitedPlacesLoaded) {
      setLoading(false);
    }
  }, [deckLoaded, visitedPlacesLoaded]);

  // Helper function to format category names (e.g., "coffee_shop" -> "Coffee Shops")
  const formatCategoryName = (category: string): string => {
    return category
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') + 's';
  };

  if (!deck || deck.places.length === 0) {
    return (
      <>
        <MorphingLoadingScreen visible={loading} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No places found in this deck.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)/HomeScreen')}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <MorphingLoadingScreen visible={loading} />
      <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButtonContainer} onPress={() => router.push('/(tabs)/HomeScreen')}>
          <Ionicons name="arrow-back" size={24} color={COLORS.mint} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.header}>{formatCategoryName(deck.category)}</Text>
        <Text style={styles.description}>
          Explore {deck.places.length} amazing {formatCategoryName(deck.category).toLowerCase()} locations
        </Text>
      </View>
      
      <FlatList
        data={deck.places}
        keyExtractor={(place) => place.id}
        renderItem={({ item }) => {
          const isVisited = visitedPlaceIds.has(item.id);
          return (
            <TouchableOpacity
              style={[styles.placeCard, isVisited && styles.visitedCard]}
              onPress={() => !isVisited && router.push(`/checkin/${item.id}`)}
              disabled={isVisited}
              activeOpacity={isVisited ? 1 : 0.7}
            >
              <View style={styles.placeInfo}>
                <Text style={[styles.placeName, isVisited && styles.visitedText]}>{item.name}</Text>
                <Text style={[styles.placeCity, isVisited && styles.visitedText]}>{item.city}</Text>
                <Text style={[styles.placeDescription, isVisited && styles.visitedText]} numberOfLines={2}>
                  {item.description}
                </Text>
                {item.distance !== undefined && (
                  <Text style={[styles.distanceText, isVisited && styles.visitedText]}>
                    📍 {(item.distance * KM_TO_MILES).toFixed(2)} miles away
                  </Text>
                )}
              </View>
              {isVisited && (
                <View style={styles.checkmarkBadge}>
                  <Ionicons name="checkmark" size={28} color={COLORS.white} />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.darkBlue,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: COLORS.mint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  headerContainer: {
    backgroundColor: COLORS.tealDark,
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 18,
    color: COLORS.mint,
    marginLeft: 8,
    fontWeight: '600',
  },
  header: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 8,
    color: COLORS.mint,
  },
  description: {
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.teal,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  placeCard: { 
    padding: 16, 
    backgroundColor: COLORS.tealDark, 
    borderRadius: 12, 
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  visitedCard: {
    backgroundColor: '#0a2327', // Darker shade
    opacity: 0.7,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: { 
    fontSize: 20, 
    fontWeight: '600',
    marginBottom: 4,
    color: COLORS.mint,
  },
  placeCity: { 
    fontSize: 14,
    color: COLORS.teal,
    marginBottom: 8,
    fontWeight: '500',
  },
  placeDescription: {
    fontSize: 14,
    color: COLORS.white,
    lineHeight: 20,
    marginBottom: 8,
  },
  distanceText: {
    fontSize: 13,
    color: COLORS.teal,
    fontStyle: 'italic',
  },
  visitedText: {
    color: '#rgba(255, 255, 255, 0.6)', // Dimmed text for visited places
  },
  checkmarkBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});
