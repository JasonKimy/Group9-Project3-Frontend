import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { calculateDistance, fetchPlacesByCategory } from '../services/api';
import { Deck } from './models';

// Color palette for the Wander app
const COLORS = {
  darkBlue: '#15292E',  // Background primary dark
  tealDark: '#074047',  // Input background
  teal: '#108585',  // Accent color / links
  mint: '#1DA27E',  // Primary button color / highlights
  white: '#fff',    // Text color
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
        // Fetch places by category (treating category as deckId)
        const places = await fetchPlacesByCategory(deckId);
        
        // Calculate distances if user location is available
        const placesWithDistance = places.map((place) => {
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
            id: deckId,
            name: formatCategoryName(deckId),
            description: `Explore ${placesWithDistance.length} amazing ${formatCategoryName(deckId).toLowerCase()} locations`,
            category: deckId,
            places: placesWithDistance,
            completedCount: 0,
          });
        }
      } catch (err) {
        console.error('Error fetching deck:', err);
        if (mounted) {
          Alert.alert('Error', 'Failed to load places. Please try again.');
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.mint} />
        <Text style={styles.loadingText}>Loading places...</Text>
      </View>
    );
  }

  if (!deck || deck.places.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No places found in this deck.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>{deck.name}</Text>
        <Text style={styles.description}>{deck.description}</Text>
        <Text style={styles.progressText}>
          {deck.completedCount} / {deck.places.length} completed
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
                  📍 {item.distance.toFixed(1)} km away
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
    borderRadius: 10,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  headerContainer: {
    backgroundColor: COLORS.tealDark,
    padding: 20,
    paddingTop: 60,
  },
  header: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 8,
    color: COLORS.white,
  },
  description: {
    fontSize: 16,
    color: '#d0f0ed',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.mint,
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
  },
  placeInfo: {
    flex: 1,
  },
  placeName: { 
    fontSize: 20, 
    fontWeight: '600',
    marginBottom: 4,
    color: COLORS.white,
  },
  placeCity: { 
    fontSize: 14,
    color: COLORS.mint,
    marginBottom: 8,
    fontWeight: '500',
  },
  placeDescription: {
    fontSize: 14,
    color: '#d0f0ed',
    lineHeight: 20,
    marginBottom: 8,
  },
  distanceText: {
    fontSize: 13,
    color: COLORS.teal,
    fontStyle: 'italic',
  },
  visited: { 
    backgroundColor: COLORS.teal,
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
