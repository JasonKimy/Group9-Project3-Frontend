import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { calculateDistance, fetchPlaceById } from '../services/api';
import { Place } from './models';

const CHECK_IN_RADIUS_KM = 0.5; // 500 meters

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
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  // Fetch place details
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
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
    if (!userLocation || !place) return;
    const dist = calculateDistance(userLocation.latitude, userLocation.longitude, place.lat, place.lon);
    if (dist > CHECK_IN_RADIUS_KM) {
      Alert.alert('Too Far Away', `You must be within ${CHECK_IN_RADIUS_KM * 1000}m to check in. You are ${(dist*1000).toFixed(0)}m away.`);
      return;
    }
    setCheckingIn(true);
    try {
      console.log('Check-in successful:', { placeId: place.id, latitude: userLocation.latitude, longitude: userLocation.longitude, photoUri: photo });
      Alert.alert('✓ Check-In Successful!', `You've checked in at ${place.name}!`, [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to complete check-in.');
    } finally { setCheckingIn(false); }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission Required', 'Camera access is required.');
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4,3], quality: 0.8 });
    if (!result.canceled && result.assets?.length) setPhoto(result.assets[0].uri);
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission Required', 'Photo library access is required.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4,3], quality: 0.8 });
    if (!result.canceled && result.assets?.length) setPhoto(result.assets[0].uri);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.mint} />
        <Text style={styles.loadingText}>Loading place details...</Text>
      </View>
    );
  }

  if (!place) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Place not found.</Text>
      </View>
    );
  }

  const isWithinRadius = distance !== null && distance <= CHECK_IN_RADIUS_KM;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        <Text style={styles.title}>{place.name}</Text>
        <Text style={styles.category}>{place.category.replace('_',' ').toUpperCase()} • {place.city}</Text>
        <Text style={styles.description}>{place.description}</Text>
        {distance !== null && (
          <View style={styles.distanceContainer}>
            <Text style={styles.distanceLabel}>Distance from you:</Text>
            <Text style={[styles.distanceValue, !isWithinRadius && styles.distanceFar]}>
              {(distance*1000).toFixed(0)}m away
            </Text>
            {!isWithinRadius && <Text style={styles.distanceWarning}>⚠️ Within {CHECK_IN_RADIUS_KM*1000}m to check in</Text>}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Add a Photo (Optional)</Text>
        {photo ? (
          <>
            <Image source={{ uri: photo }} style={styles.image} />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.photoButton} onPress={pickImage}><Text style={styles.buttonText}>Retake</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.photoButton, styles.removeButton]} onPress={() => setPhoto(null)}><Text style={styles.buttonText}>Remove</Text></TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.photoButton} onPress={pickImage}><Text style={styles.buttonText}>📷 Take Photo</Text></TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={pickFromGallery}><Text style={styles.buttonText}>🖼️ Choose from Gallery</Text></TouchableOpacity>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.darkBlue },
  contentContainer: { padding: 16 },
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
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: COLORS.mint },
  image: { width: '100%', height: 250, borderRadius: 8, marginBottom: 12 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  photoButton: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: COLORS.mint, alignItems: 'center', marginHorizontal: 2 },
  removeButton: { backgroundColor: COLORS.error },
  buttonText: { color: COLORS.white, fontWeight: 'bold' },
  checkInButton: { padding: 16, borderRadius: 10, backgroundColor: COLORS.mint, alignItems: 'center' },
  disabledButton: { backgroundColor: COLORS.warning },
  checkInButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  warningText: { marginTop: 8, fontSize: 14, color: COLORS.teal, textAlign: 'center' },
  coordinatesContainer: { padding: 12, backgroundColor: COLORS.tealDark, borderRadius: 8 },
  coordinatesText: { fontSize: 12, color: COLORS.teal, fontFamily: 'monospace', marginBottom: 4 },
});
