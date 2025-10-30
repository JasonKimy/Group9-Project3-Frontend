//componentd/PlaceCard.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import colors from '../constants/colors';

//Interface for the props the PlaceCard component expects
interface PlaceCardProps {
  name: string;
  description: string;
  image: string;
}

//Reusable card component to display a place the user can visit
export default function PlaceCard({ name, description, image }: PlaceCardProps) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: image }} style={styles.cardImage} />
      <Text style={styles.cardTitle}>{name}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </View>
  );
}

//styling for the PlaceCard component
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardImage: { width: 80, height: 80, marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.black },
  cardDescription: { fontSize: 14, color: colors.gray },
});
