import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

// Self-contained Explore screen — uses only React Native primitives so it works
// without pulling in project-wide themed components.
export default function ExploreScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Tips and example content (standalone)</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>File-based routing</Text>
        <Text style={styles.sectionText}>This folder contains the app's tab screens: index and explore.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Platform support</Text>
        <Text style={styles.sectionText}>This screen is written with plain React Native so it runs on Android, iOS, and web.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Images</Text>
        <Image source={{ uri: 'https://reactnative.dev/img/header_logo.svg' }} style={styles.logo} />
        <Text style={styles.sectionText}>Use remote or local images; this example uses a remote SVG-friendly URL.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { color: '#666' },
  section: { marginTop: 12, padding: 12, backgroundColor: '#fff', borderRadius: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  sectionText: { color: '#333' },
  logo: { width: 100, height: 80, alignSelf: 'center', marginTop: 8 },
});
