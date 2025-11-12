import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './app';

type Props = NativeStackScreenProps<RootStackParamList, 'CheckIn'>;

export default function CheckInScreen({ route, navigation }: Props) {
  const { placeId } = route.params;
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is required for check-ins.');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const formData = new FormData();
      formData.append('placeId', placeId);
      formData.append('latitude', String(location.coords.latitude));
      formData.append('longitude', String(location.coords.longitude));

      if (photo) {
        formData.append('photo', {
          uri: photo,
          type: 'image/jpeg',
          name: 'checkin.jpg',
        } as any);
      }

      // await axios.post('https://our-backend.com/api/checkin', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' },
      // });

      Alert.alert('Success', 'Check-in completed!');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to check in.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check In</Text>
      {photo && <Image source={{ uri: photo }} style={styles.image} />}
      <Button title="Take Photo" onPress={pickImage} />
      <View style={{ height: 16 }} />
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Check In" onPress={handleCheckIn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  image: { width: 250, height: 250, borderRadius: 8, marginVertical: 12 },
});
