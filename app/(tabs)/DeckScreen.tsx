import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculateDistance, getDeckById, Deck, Place } from '../services/api';
import MorphingLoadingScreen from '../components/MorphingLoadingScreen';

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
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

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
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [deckId, userLocation]);

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
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.placeCard, item.visited && styles.visited]}
            onPress={() => router.push(`/checkin/${item.id}`)}
          >
            <View style={styles.placeInfo}>
              <Text style={styles.placeName}>{item.name}</Text>
              <Text style={styles.placeCity}>{item.city}</Text>
              <Text style={styles.placeDescription} numberOfLines={2}>
                {item.description}
              </Text>
              {item.distance !== undefined && (
                <Text style={styles.distanceText}>
                  📍 {(item.distance * KM_TO_MILES).toFixed(2)} miles away
                </Text>
              )}
            </View>
            {item.visited && (
              <View style={styles.visitedBadge}>
                <Text style={styles.visitedText}>✓ Visited</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
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
  visited: { 
    backgroundColor: '#e8f5e9',
    borderWidth: 2,
    borderColor: COLORS.mint,
  },
  visitedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.mint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  visitedText: { 
    color: COLORS.white, 
    fontWeight: 'bold',
    fontSize: 12,
  },
});
