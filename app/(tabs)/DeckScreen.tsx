import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Deck, Place } from '../types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'Deck'>;

export default function DeckScreen({ route, navigation }: Props) {
  const { deckId } = route.params;
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get<Deck>(`https://your-backend.com/api/decks/${deckId}`)
      .then(res => setDeck(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [deckId]);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  if (!deck) return <Text style={{ textAlign: 'center' }}>Deck not found.</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{deck.name}</Text>
      <FlatList
        data={deck.places}
        keyExtractor={(place) => place.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.placeCard, item.visited && styles.visited]}
            onPress={() => navigation.navigate('CheckIn', { placeId: item.id })}
          >
            <Text style={styles.placeName}>{item.name}</Text>
            <Text style={styles.placeAddress}>{item.address}</Text>
            {item.visited && <Text style={styles.visitedText}>Visited</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  placeCard: { padding: 14, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10 },
  placeName: { fontSize: 18, fontWeight: '500' },
  placeAddress: { color: '#555' },
  visited: { backgroundColor: '#d4fcd4' },
  visitedText: { color: 'green', fontWeight: 'bold', marginTop: 4 },
});
