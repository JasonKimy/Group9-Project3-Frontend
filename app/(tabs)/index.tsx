

// import { registerRootComponent } from 'expo';
// import App from './App';

// registerRootComponent(App);



//index.tsx
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import PlaceCard from '../../components/PlaceCard';
import colors from '../../constants/colors';

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
