import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

interface Deck {
  id: string;
  name: string;
  places: { id: string; name: string }[];
}

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [decks, setDecks] = useState<Deck[]>([]);

  useEffect(() => {
    // axios.get<Deck[]>('backend api here')
      .then(res => setDecks(res.data))
      .catch(console.error);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>This Week’s Challenges</Text>
      <FlatList
        data={decks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.deckCard}
            onPress={() => navigation.navigate('Deck', { deckId: item.id })}
          >
            <Text style={styles.deckName}>{item.name}</Text>
            <Text>{item.places.length} places</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  deckCard: { padding: 16, backgroundColor: '#eef', marginVertical: 8, borderRadius: 10 },
  deckName: { fontSize: 18, fontWeight: '500' },
});
