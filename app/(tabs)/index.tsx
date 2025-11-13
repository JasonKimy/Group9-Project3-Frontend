import { FlatList, Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';

// Local, tiny color map so this file doesn't rely on project-wide constants
const colors = {
  background: '#f7f7fb',
  primary: '#0066cc',
  white: '#ffffff',
  black: '#000000',
};

// Simple inline PlaceCard so this screen is self-contained.
function PlaceCard({ id, name, description, image }: any) {
  return (
    <View style={cardStyles.card} key={id}>
      <Image source={{ uri: image }} style={cardStyles.image} />
      <View style={cardStyles.body}>
        <Text style={cardStyles.title}>{name}</Text>
        <Text style={cardStyles.desc}>{description}</Text>
      </View>
    </View>
  );
}

//Will have to change this to redirect into account page first
//Starting at create account

//Mock data for places the user can visit
//Each place will be displayed as a card on the homepage
const places = [
  {
    id: '1',
    name: 'Library',
    description: 'Read and relax',
    image: 'https://img.icons8.com/ios-filled/100/000000/library.png',
  },
  {
    id: '2',
    name: 'Hiking Trail',
    description: 'Explore nature',
    image: 'https://img.icons8.com/ios-filled/100/000000/trekking.png',
  },
  {
    id: '3',
    name: 'Coffee Shop',
    description: 'Grab a drink',
    image: 'https://img.icons8.com/ios-filled/100/000000/coffee.png',
  },
  {
    id: '4',
    name: 'Gym',
    description: 'Get moving',
    image: 'https://img.icons8.com/ios-filled/100/000000/dumbbell.png',
  },
];


// Homepage component for the Move & Collect app
// Displays a header, intro text, and a list of place cards
export default function Home() {
  const renderCard = ({ item }: any) => <PlaceCard {...item} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Let's Wander</Text>
        <Text style={styles.headerSubtitle}>Visit places, get active, and collect cards!</Text>
      </View>

      <View style={styles.intro}>
        <Text style={styles.introText}>
          Track your visits to local spots like libraries, hiking trails, coffee shops, and gyms to unlock cards!
        </Text>
      </View>

      <FlatList
        data={places}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.cardsContainer}
      />
    </SafeAreaView>
  );
}

// Styles for the homepage
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.white },
  headerSubtitle: { fontSize: 16, color: colors.white, marginTop: 5, textAlign: 'center' },
  intro: { padding: 15, alignItems: 'center' },
  introText: { textAlign: 'center', fontSize: 14, color: colors.black },
  cardsContainer: { paddingHorizontal: 10, paddingBottom: 20 },
});

const cardStyles = StyleSheet.create({
  card: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderRadius: 10, marginVertical: 8, alignItems: 'center' },
  image: { width: 56, height: 56, marginRight: 12 },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600' },
  desc: { color: '#555' },
});
