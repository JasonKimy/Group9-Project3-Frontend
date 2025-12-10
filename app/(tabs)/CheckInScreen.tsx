import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateDistance, fetchPlaceById, createCheckIn, addPointsToUser, User } from '../services/api';
import { Place } from './models';
import MorphingLoadingScreen from '../components/MorphingLoadingScreen';

const CHECK_IN_RADIUS_KM = 0.5; // 500 meters
const KM_TO_MILES = 0.621371; // Conversion factor

const COLORS = {
  darkBlue: '#15292E',
  tealDark: '#074047',
  teal: '#108585',
  mint: '#1DA27E',
  white: '#fff',
  warning: '#ff9500',
  success: '#34c759',
  error: '#ff3b30',
};

export default function CheckInScreen() {
  const { placeId } = useLocalSearchParams() as { placeId: string };
  const router = useRouter();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Fetch current user and place details
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Get current user from AsyncStorage
        const userJson = await AsyncStorage.getItem('user');
        if (userJson && mounted) {
          const user: User = JSON.parse(userJson);
          setCurrentUser(user);
        }
        
        // Fetch place details
        const placeData = await fetchPlaceById(placeId);
        if (mounted) setPlace(placeData);
      } catch (err) {
        console.error(err);
        if (mounted) Alert.alert('Error', 'Failed to load place details.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [placeId]);

  // Get user location
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (mounted) Alert.alert('Permission Required', 'Location access is required for check-ins.');
          return;
        }
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (mounted) {
          setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
          if (place) {
            setDistance(calculateDistance(location.coords.latitude, location.coords.longitude, place.lat, place.lon));
          }
        }
      } catch (err) {
        console.error(err);
        if (mounted) Alert.alert('Error', 'Failed to get your location.');
      }
    })();
    return () => { mounted = false; };
  }, [place]);

  const handleCheckIn = async () => {
    if (!userLocation || !place) {
      Alert.alert('Error', 'Unable to check in. Location or place data is missing.');
      return;
    }
    
    // Get fresh user data from AsyncStorage
    const userJson = await AsyncStorage.getItem('user');
    if (!userJson) {
      Alert.alert('Error', 'Unable to check in. Please ensure you are logged in.');
      return;
    }
    const user: User = JSON.parse(userJson);
    
    const dist = calculateDistance(userLocation.latitude, userLocation.longitude, place.lat, place.lon);
    if (dist > CHECK_IN_RADIUS_KM) {
      const distMiles = (dist * KM_TO_MILES).toFixed(2);
      const radiusMiles = (CHECK_IN_RADIUS_KM * KM_TO_MILES).toFixed(2);
      Alert.alert('Too Far Away', `You must be within ${radiusMiles} miles to check in. You are ${distMiles} miles away.`);
      return;
    }
    
    setCheckingIn(true);
    try {
      // Create the check-in in the database
      await createCheckIn(user.id, place.id);
      
      // Add 50 points to the user
      const updatedUser = await addPointsToUser(user.id, 50);
      
      // Update the user in AsyncStorage with new points
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      console.log('Check-in successful:', { userId: user.id, placeId: place.id, pointsAdded: 50 });
      
      // Navigate to VisitedPlacesScreen immediately
      router.push('/(tabs)/VisitedPlacesScreen');
      
      // Show success message without blocking navigation
      setTimeout(() => {
        Alert.alert('✓ Check-In Successful!', `You've checked in at ${place.name} and earned 50 points!`);
      }, 100);
    } catch (err) {
      console.error('Check-in error:', err);
      Alert.alert('Error', 'Failed to complete check-in. Please try again.');
      setCheckingIn(false);
    }
  };

  if (!place) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Place not found.</Text>
      </View>
    );
  }

  const isWithinRadius = distance !== null && distance <= CHECK_IN_RADIUS_KM;

  return (
    <>
      <MorphingLoadingScreen visible={loading} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <TouchableOpacity style={styles.backButtonContainer} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.mint} />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      
      <View style={styles.card}>
        <Text style={styles.title}>{place.name}</Text>
        <Text style={styles.category}>{place.category.replace('_',' ').toUpperCase()} • {place.city}</Text>
        <Text style={styles.description}>{place.description}</Text>
        {distance !== null && (
          <View style={styles.distanceContainer}>
            <Text style={styles.distanceLabel}>Distance from you:</Text>
            <Text style={[styles.distanceValue, !isWithinRadius && styles.distanceFar]}>
              {(distance * KM_TO_MILES).toFixed(2)} miles away
            </Text>
            {!isWithinRadius && <Text style={styles.distanceWarning}>⚠️ Within {(CHECK_IN_RADIUS_KM * KM_TO_MILES).toFixed(2)} miles to check in</Text>}
          </View>
        )}
      </View>

      <View style={styles.card}>
        {checkingIn ? (
          <ActivityIndicator size="large" color={COLORS.mint} />
        ) : (
          <TouchableOpacity
            style={[styles.checkInButton, !isWithinRadius && styles.disabledButton]}
            onPress={handleCheckIn}
            disabled={!isWithinRadius || !userLocation}
          >
            <Text style={styles.checkInButtonText}>{isWithinRadius ? '✓ Check In Now' : 'Too Far Away'}</Text>
          </TouchableOpacity>
        )}
        {!userLocation && <Text style={styles.warningText}>Getting your location...</Text>}
      </View>

      <View style={styles.coordinatesContainer}>
        <Text style={styles.coordinatesText}>Place coordinates: {place.lat.toFixed(4)}, {place.lon.toFixed(4)}</Text>
        {userLocation && <Text style={styles.coordinatesText}>Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}</Text>}
      </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.darkBlue },
  contentContainer: { padding: 16 },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 18,
    color: COLORS.mint,
    marginLeft: 8,
    fontWeight: '600',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.darkBlue },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.white },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 18, color: COLORS.error },
  card: { backgroundColor: COLORS.tealDark, padding: 16, borderRadius: 12, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.mint, marginBottom: 8 },
  category: { fontSize: 14, color: COLORS.teal, fontWeight: '600', marginBottom: 12 },
  description: { fontSize: 16, color: COLORS.white, lineHeight: 22 },
  distanceContainer: { marginTop: 16, borderTopWidth: 1, borderTopColor: COLORS.teal, paddingTop: 12 },
  distanceLabel: { fontSize: 14, color: COLORS.teal, marginBottom: 4 },
  distanceValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.success },
  distanceFar: { color: COLORS.warning },
  distanceWarning: { fontSize: 13, color: COLORS.warning, marginTop: 6, fontStyle: 'italic' },
  checkInButton: { padding: 16, borderRadius: 10, backgroundColor: COLORS.mint, alignItems: 'center' },
  disabledButton: { backgroundColor: COLORS.warning },
  checkInButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  warningText: { marginTop: 8, fontSize: 14, color: COLORS.teal, textAlign: 'center' },
  coordinatesContainer: { padding: 12, backgroundColor: COLORS.tealDark, borderRadius: 8 },
  coordinatesText: { fontSize: 12, color: COLORS.teal, fontFamily: 'monospace', marginBottom: 4 },
});
