// app/(tabs)/LoginScreen.tsx
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { RootStackParamList } from './app';

// Color palette for the Wander app
const COLORS = {
  darkBlue: '#15292E',  // Background primary dark
  tealDark: '#074047',  // Input background
  teal: '#108585',  // Accent color / links
  mint: '#1DA27E',  // Primary button color / highlights
  white: '#fff',    // Text color
};

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // For now, just navigate to Home
    navigation.replace('Home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>WANDER</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.teal}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.teal}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Styles for the login page
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.darkBlue },
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.mint, marginBottom: 40 },
  input: {
    width: '100%',
    padding: 14,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: COLORS.tealDark,
    color: COLORS.white,
    fontSize: 16,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 10,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 18 },
});
