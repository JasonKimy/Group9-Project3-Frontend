import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';

// Color palette
const COLORS = {
  darkBlue: '#15292E',
  tealDark: '#074047',
  teal: '#108585',
  mint: '#1DA27E',
  white: '#fff',
};

export default function AuthScreen() {
  const router = useRouter();

  // Track whether user is on login or create account mode
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = () => {
    if (!email || !password || (!isLogin && !confirmPassword)) {
      alert('Please fill all fields');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    console.log(isLogin ? 'Logging in...' : 'Creating account...', { email, password });

    // Navigate to HomeScreen after login
    if (isLogin) {
      router.replace('/HomeScreen'); // send user into your tab navigator
    } else {
      setIsLogin(true);
      alert('Account created! Please log in.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>{isLogin ? 'Login' : 'Create Account'}</Text>

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

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={COLORS.teal}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          )}

          <TouchableOpacity style={styles.button} onPress={handleSubmit} testID={isLogin ? "login-button" : "create-button"}>
            <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Create Account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.toggleText}>
              {isLogin
                ? "Don't have an account? Create one"
                : 'Already have an account? Login'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
// Styles for the login / create account page
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
  toggleText: { color: COLORS.teal, textAlign: 'center', marginTop: 10, fontSize: 14 },
});
