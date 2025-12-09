import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { loginOAuth, loginUser } from './services/api';
import MorphingLoadingScreen from './components/MorphingLoadingScreen';

// Web-compatible alert function
const showAlert = (title: string, message: string, onOk?: () => void) => {
  if (Platform.OS === 'web') {
    // For web, use browser alert and console
    console.log(`[${title}] ${message}`);
    alert(`${title}\n\n${message}`);
    if (onOk) onOk();
  } else {
    if (onOk) {
      Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
    } else {
      Alert.alert(title, message);
    }
  }
};

// Color palette
const COLORS = {
  darkBlue: '#15292E',
  tealDark: '#074047',
  teal: '#108585',
  mint: '#1DA27E',
  white: '#fff',
};

WebBrowser.maybeCompleteAuthSession();

const BACKEND_URL = Platform.OS === 'android'
 ? "http://10.0.2.2:8080"
 : "http://localhost:8080";

const GITHUB_CLIENT_ID = Platform.OS === 'web'
? 'Ov23liOiRYo73gYcLLyY'
: 'Ov23liPIepqr03CaQkSy';

const WEB_GOOGLE_CLIENT_ID = "125707708783-dmsogn4hns891vtucqj8pva07sq6odam.apps.googleusercontent.com";
const IOS_GOOGLE_CLIENT_ID = "125707708783-2653sk3rppr4tq29rdfrdgvubecuik9l.apps.googleusercontent.com";
const ANDROID_GOOGLE_CLIENT_ID = "125707708783-9lb5th2rqom1m2ff89ls34870qg0983b.apps.googleusercontent.com";

export default function AuthScreen() {

 const [githubLoading, setGithubLoading] = useState(false);
 const [googleLoading, setGoogleLoading] = useState(false);
 const [userInfo, setUserInfo] = useState(null);

 const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

 const githubDiscovery = {
   authorizationEndpoint: 'https://github.com/login/oauth/authorize',
 };

 const githubRedirectUri = Platform.OS === 'web'
 ? 'http://localhost:8081'
 : 'myapp://';

 const [githubRequest, githubResponse, githubPromptAsync] = AuthSession.useAuthRequest(
   {
     clientId: GITHUB_CLIENT_ID,
     scopes: ['user:email'],
     redirectUri: githubRedirectUri,
     usePKCE: false,
   },
   githubDiscovery
 );

 const googleDiscovery = {
   authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
 };

 const googleClientId = (() => {
   if (Platform.OS === 'ios') {
     return IOS_GOOGLE_CLIENT_ID;
   } else if (Platform.OS === 'android') {
     return ANDROID_GOOGLE_CLIENT_ID;
   } else {
     return WEB_GOOGLE_CLIENT_ID;
   }
 })();

const googleRedirectUri = Platform.OS === 'web'
  ? 'http://localhost:8081'
  : 'com.googleusercontent.apps.125707708783-2653sk3rppr4tq29rdfrdgvubecuik9l:/oauth2redirect';

const [googleRequest, googleResponse, googlePromptAsync] = AuthSession.useAuthRequest(
  {
    clientId: googleClientId,
    scopes: ['email', 'profile'],
    redirectUri: googleRedirectUri,
    usePKCE: false,
  },
  googleDiscovery
);

 useEffect(() => {
   if (githubResponse?.type === 'success') {
     const { code } = githubResponse.params;
     handleGitHubCode(code);
   } else if (githubResponse?.type === 'error') {
     Alert.alert("Error", "github fail");
     setGithubLoading(false);
   } else if (githubResponse?.type === 'dismiss' || githubResponse?.type === 'cancel') {
     setGithubLoading(false);
   }
 }, [githubResponse]);

 useEffect(() => {
   if (googleResponse?.type === 'success') {
     const { code } = googleResponse.params;
     handleGoogleCode(code);
   } else if (googleResponse?.type === 'error') {
     Alert.alert("Error", "google fail");
     setGoogleLoading(false);
   } else if (googleResponse?.type === 'dismiss' || googleResponse?.type === 'cancel') {
     setGoogleLoading(false);
   }
 }, [googleResponse]);

 const handleGitHubCode = async (code: string) => {
   try {
     console.log("github code - ", code);
     const platform = Platform.OS;

     const response = await fetch(`${BACKEND_URL}/api/auth/github/exchange`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ code, platform }),
     });

     const data = await response.json();
     console.log("github backend - ", data);

     if (data.success && data.email) {
      oauthLogin(data.email);
     } else {
       Alert.alert("Error", data.error || "NOOOOOOOOOOOO");
     }

     setGithubLoading(false);
   } catch (error) {
     setGithubLoading(false);
     console.error("guthub error:", error);
     Alert.alert("Error", `github error: ${error}`);
   }
 };

 const handleGoogleCode = async (code: string) => {
   try {
     console.log("got google code:", code);
     console.log("redirect uri:", googleRedirectUri);
     console.log("platform:", Platform.OS);

     const platform = Platform.OS;

     const response = await fetch(`${BACKEND_URL}/api/auth/google/exchange`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         code,
         platform,
         redirectUri: googleRedirectUri,
       }),
     });

     const data = await response.json();
     console.log("google backend - ", data);
     
     if (data.success && data.email) {
      oauthLogin(data.email);
     } else {
       Alert.alert("Error", data.error || "NOOOOOOOOOOOO");
     }

     setGoogleLoading(false);
   } catch (error) {
     setGoogleLoading(false);
     console.error("google error:", error);
     Alert.alert("Error", `google error: ${error}`);
   }
 };

 const handleGitHubLogin = () => {
   console.log("github login");
   setGithubLoading(true);
   githubPromptAsync();
 };

 const handleGoogleLogin = () => {
   console.log("google login");
   setGoogleLoading(true);
   googlePromptAsync();
 };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Error', 'Please enter both username/email and password');
      return;
    }

    setLoading(true);
    
    try {
      const user = await loginUser(email, password);
      
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('isLoggedIn', 'true');
      
      showAlert('Success', `Welcome back, ${user.username}!`);
      router.replace('/(tabs)/HomeScreen');
    } catch (error) {
      showAlert('Login Failed', error instanceof Error ? error.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const oauthLogin = async (userEmail: string) => {
    if (!userEmail) {
      showAlert('Error', 'Authentication failed');
      return;
    }

    setLoading(true);
    
    try {
      const user = await loginOAuth(userEmail);
      
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('isLoggedIn', 'true');
      
      showAlert('Success', `Welcome back, ${user.username}!`);
      router.replace('/(tabs)/HomeScreen');
    } catch (error) {
      showAlert('Login Failed', error instanceof Error ? error.message : 'User does not exist');
    } finally {
      setLoading(false);
    }
  };



  return (
    <>
      <MorphingLoadingScreen visible={loading || githubLoading || googleLoading} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Login</Text>

          <TextInput
            style={styles.input}
            placeholder="Username or Email"
            placeholderTextColor={COLORS.teal}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.teal}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleLogin} 
            disabled={loading}
            testID="login-button"
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('./SignUpScreen')}
            disabled={loading}
          >
            <Text style={styles.toggleText}>
              Don't have an account? Create one
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      
       <View>
         <TouchableOpacity
           onPress={handleGitHubLogin}
           disabled={!githubRequest}
         >
           <Text>login with github</Text>
         </TouchableOpacity>

         <View/>

         <TouchableOpacity
           onPress={handleGoogleLogin}
           disabled={!googleRequest}
         >
           <Text>login with google</Text>
         </TouchableOpacity>
       </View>

    </SafeAreaView>
    </>
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
  buttonDisabled: {
    backgroundColor: COLORS.teal,
    opacity: 0.6,
  },
  buttonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 18 },
  toggleText: { color: COLORS.teal, textAlign: 'center', marginTop: 10, fontSize: 14 },
  challengeContainer: {
    width: '100%',
    marginBottom: 20,
  },
  challengeLabel: {
    color: COLORS.mint,
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.tealDark,
    borderWidth: 2,
    borderColor: COLORS.tealDark,
  },
  categoryButtonSelected: {
    backgroundColor: COLORS.mint,
    borderColor: COLORS.mint,
  },
  categoryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
