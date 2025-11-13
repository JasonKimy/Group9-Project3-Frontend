import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { calculateDistance, fetchPlaceById } from '../services/api';
import { Place } from './models';

// Color palette for the Wander app
const COLORS = {
  darkBlue: '#15292E',  // Background primary dark
  tealDark: '#074047',  // Input background
  teal: '#108585',  // Accent color / links
  mint: '#1DA27E',  // Primary button color / highlights
  white: '#fff',    // Text color
};

const CHECK_IN_RADIUS_KM = 0.5; // User must be within 500 meters to check in

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
        if (mounted) {
          setPlace(placeData);
        }
      } catch (err) {
        console.error('Error fetching place:', err);
        if (mounted) {
          Alert.alert('Error', 'Failed to load place details.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [placeId]);

  // Get user location and calculate distance
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (mounted) {
            Alert.alert('Permission Required', 'Location access is required for check-ins.');
          }
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (mounted) {
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          // Calculate distance if place data is loaded
          if (place) {
            const dist = calculateDistance(
              location.coords.latitude,
              location.coords.longitude,
              place.lat,
              place.lon
            );
            setDistance(dist);
          }
        }
      } catch (err) {
        console.error('Error getting location:', err);
        if (mounted) {
          Alert.alert('Error', 'Failed to get your location.');
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [place]);

  const handleCheckIn = async () => {
    if (!userLocation || !place) {
      Alert.alert('Error', 'Location or place data not available.');
      return;
    }

    // Calculate distance
    const dist = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      place.lat,
      place.lon
    );

    // Verify user is within check-in radius
    if (dist > CHECK_IN_RADIUS_KM) {
      Alert.alert(
        'Too Far Away',
        `You must be within ${CHECK_IN_RADIUS_KM * 1000}m of ${place.name} to check in. You are currently ${(dist * 1000).toFixed(0)}m away.`
      );
      return;
    }

    setCheckingIn(true);
    try {
      // For now, we'll just store the check-in locally
      // In a full implementation, this would send to the backend
      const checkInData = {
        placeId: place.id,
        placeName: place.name,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        timestamp: new Date().toISOString(),
        photoUri: photo,
      };

      // Log the check-in (in production, send to backend)
      console.log('Check-in successful:', checkInData);

      // Show success message with details
      Alert.alert(
        '✓ Check-In Successful!',
        `You've checked in at ${place.name}!\n\nYou earned points for this visit.`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err) {
      console.error('Check-in error:', err);
      Alert.alert('Error', 'Failed to complete check-in. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library access is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image.');
    }
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
      <View style={styles.placeInfoContainer}>
        <Text style={styles.title}>{place.name}</Text>
        <Text style={styles.category}>
          {place.category.replace('_', ' ').toUpperCase()} • {place.city}
        </Text>
        <Text style={styles.description}>{place.description}</Text>
        
        {distance !== null && (
          <View style={styles.distanceContainer}>
            <Text style={styles.distanceLabel}>Distance from you:</Text>
            <Text style={[styles.distanceValue, !isWithinRadius && styles.distanceFar]}>
              {(distance * 1000).toFixed(0)}m away
            </Text>
            {!isWithinRadius && (
              <Text style={styles.distanceWarning}>
                ⚠️ You need to be within {CHECK_IN_RADIUS_KM * 1000}m to check in
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.photoSection}>
        <Text style={styles.sectionTitle}>Add a Photo (Optional)</Text>
        {photo ? (
          <View>
            <Image source={{ uri: photo }} style={styles.image} />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={pickImage}>
                <Text style={styles.buttonText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonDanger]} onPress={() => setPhoto(null)}>
                <Text style={styles.buttonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={pickImage}>
              <Text style={styles.buttonText}>📷 Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={pickFromGallery}>
              <Text style={styles.buttonText}>🖼️ Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.checkInSection}>
        {checkingIn ? (
          <ActivityIndicator size="large" color={COLORS.mint} />
        ) : (
          <>
            <TouchableOpacity 
              style={[styles.checkInButton, (!isWithinRadius || !userLocation) && styles.checkInButtonDisabled]}
              onPress={handleCheckIn}
              disabled={!isWithinRadius || !userLocation}
            >
              <Text style={styles.checkInButtonText}>
                {isWithinRadius ? '✓ Check In Now' : 'Too Far Away'}
              </Text>
            </TouchableOpacity>
            {!userLocation && (
              <Text style={styles.warningText}>Getting your location...</Text>
            )}
          </>
        )}
      </View>

      <View style={styles.coordinatesContainer}>
        <Text style={styles.coordinatesText}>
          Place coordinates: {place.lat.toFixed(4)}, {place.lon.toFixed(4)}
        </Text>
        {userLocation && (
          <Text style={styles.coordinatesText}>
            Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.darkBlue,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.darkBlue,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.white,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: COLORS.darkBlue,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.mint,
  },
  placeInfoContainer: {
    backgroundColor: COLORS.tealDark,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 8,
    color: COLORS.white,
  },
  category: {
    fontSize: 14,
    color: COLORS.mint,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#d0f0ed',
    lineHeight: 24,
  },
  distanceContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.teal,
  },
  distanceLabel: {
    fontSize: 14,
    color: '#d0f0ed',
    marginBottom: 4,
  },
  distanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.mint,
  },
  distanceFar: {
    color: '#ff9500',
  },
  distanceWarning: {
    fontSize: 13,
    color: '#ff9500',
    marginTop: 8,
    fontStyle: 'italic',
  },
  photoSection: {
    backgroundColor: COLORS.tealDark,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: COLORS.white,
  },
  image: { 
    width: '100%', 
    height: 250, 
    borderRadius: 8, 
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    backgroundColor: COLORS.mint,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDanger: {
    backgroundColor: '#ff3b30',
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  checkInSection: {
    backgroundColor: COLORS.tealDark,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  checkInButton: {
    backgroundColor: COLORS.mint,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkInButtonDisabled: {
    backgroundColor: '#666',
  },
  checkInButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  warningText: {
    marginTop: 8,
    fontSize: 14,
    color: '#d0f0ed',
    textAlign: 'center',
  },
  coordinatesContainer: {
    padding: 12,
    backgroundColor: COLORS.tealDark,
    borderRadius: 8,
  },
  coordinatesText: {
    fontSize: 12,
    color: COLORS.teal,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});
