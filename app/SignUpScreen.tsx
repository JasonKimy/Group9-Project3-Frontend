import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
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
import { createDeck, createUser, fetchCategories } from './services/api';
import MorphingLoadingScreen from './components/MorphingLoadingScreen';

// Web-compatible alert function
const showAlert = (title: string, message: string, onOk?: () => void) => {
  if (Platform.OS === 'web') {
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

// Avatar categories with their images
const AVATAR_CATEGORIES = {
  Astro: [
    require('../assets/Wander-Avatars/Astro/Astro1.png'),
    require('../assets/Wander-Avatars/Astro/Astro2.png'),
    require('../assets/Wander-Avatars/Astro/Astro3.png'),
    require('../assets/Wander-Avatars/Astro/Astro4.png'),
    require('../assets/Wander-Avatars/Astro/Astro5.png'),
  ],
  Cowboy: [
    require('../assets/Wander-Avatars/Cowboy/Cowboy1.png'),
    require('../assets/Wander-Avatars/Cowboy/Cowboy2.png'),
    require('../assets/Wander-Avatars/Cowboy/Cowboy3.png'),
    require('../assets/Wander-Avatars/Cowboy/Cowboy4.png'),
  ],
  KPOP: [
    require('../assets/Wander-Avatars/KPOP/KPOP1.png'),
    require('../assets/Wander-Avatars/KPOP/KPOP2.png'),
    require('../assets/Wander-Avatars/KPOP/KPOP3.png'),
    require('../assets/Wander-Avatars/KPOP/KPOP4.png'),
    require('../assets/Wander-Avatars/KPOP/KPOP5.png'),
    require('../assets/Wander-Avatars/KPOP/KPOP6.png'),
    require('../assets/Wander-Avatars/KPOP/KPOP7.png'),
  ],
  Normal: [
    require('../assets/Wander-Avatars/Normal/normal1.png'),
    require('../assets/Wander-Avatars/Normal/normal2.png'),
    require('../assets/Wander-Avatars/Normal/normal3.png'),
    require('../assets/Wander-Avatars/Normal/normal4.png'),
    require('../assets/Wander-Avatars/Normal/normal5.png'),
    require('../assets/Wander-Avatars/Normal/normal6.png'),
    require('../assets/Wander-Avatars/Normal/normal7.png'),
    require('../assets/Wander-Avatars/Normal/normal8.png'),
    require('../assets/Wander-Avatars/Normal/normal9.png'),
    require('../assets/Wander-Avatars/Normal/normal10.png'),
    require('../assets/Wander-Avatars/Normal/normal11.png'),
    require('../assets/Wander-Avatars/Normal/normal12.png'),
  ],
  Viking: [
    require('../assets/Wander-Avatars/Viking/Viking1.png'),
    require('../assets/Wander-Avatars/Viking/Viking2.png'),
    require('../assets/Wander-Avatars/Viking/Viking3.png'),
    require('../assets/Wander-Avatars/Viking/Viking4.png'),
  ],
};

type CategoryName = keyof typeof AVATAR_CATEGORIES;

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function SignUpScreen() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [favChallenge1, setFavChallenge1] = useState('');
  const [favChallenge2, setFavChallenge2] = useState('');
  const [loading, setLoading] = useState(false);

  // Avatar picker state
  const [selectedCategory, setSelectedCategory] = useState<CategoryName>('Normal');
  const [shuffledAvatars, setShuffledAvatars] = useState<any[]>([]);
  const [currentAvatarIndex, setCurrentAvatarIndex] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState<any>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Initialize with Normal category on mount
  useEffect(() => {
    const initialShuffled = shuffleArray(AVATAR_CATEGORIES['Normal']);
    setShuffledAvatars(initialShuffled);
    setSelectedAvatar(initialShuffled[0]);
  }, []);

  // Available categories for challenges
  const availableCategories = [
    { label: 'Coffee Shop', value: 'coffee_shop' },
    { label: 'Gym', value: 'gym' },
    { label: 'Park', value: 'park' },
    { label: 'Beach', value: 'beach' },
    { label: 'Trail', value: 'trail' },
  ];

  const handleCategorySelect = (category: CategoryName) => {
    setSelectedCategory(category);
    const shuffled = shuffleArray(AVATAR_CATEGORIES[category]);
    setShuffledAvatars(shuffled);
    setCurrentAvatarIndex(0);
    setSelectedAvatar(shuffled[0]);
  };

  const animateTransition = (direction: 'left' | 'right', callback: () => void) => {
    // Fade out and slide
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction === 'left' ? -50 : 50,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Update the avatar
      callback();
      
      // Reset position and fade in
      slideAnim.setValue(direction === 'left' ? 50 : -50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handlePreviousAvatar = () => {
    if (currentAvatarIndex > 0) {
      animateTransition('right', () => {
        const newIndex = currentAvatarIndex - 1;
        setCurrentAvatarIndex(newIndex);
        setSelectedAvatar(shuffledAvatars[newIndex]);
      });
    }
  };

  const handleNextAvatar = () => {
    if (currentAvatarIndex < shuffledAvatars.length - 1) {
      animateTransition('left', () => {
        const newIndex = currentAvatarIndex + 1;
        setCurrentAvatarIndex(newIndex);
        setSelectedAvatar(shuffledAvatars[newIndex]);
      });
    }
  };

  const handleCreateAccount = async () => {
    if (!username || !email || !password || !confirmPassword) {
      showAlert('Error', 'Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (!favChallenge1 || !favChallenge2) {
      showAlert('Error', 'Please select both favorite challenges');
      return;
    }

    if (favChallenge1 === favChallenge2) {
      showAlert('Error', 'Please select two different challenges');
      return;
    }

    if (!selectedAvatar) {
      showAlert('Error', 'Please select an avatar');
      return;
    }

    setLoading(true);
    
    try {
      // Create the user account
      const user = await createUser(username, password, email, favChallenge1, favChallenge2);
      
      // Get all available categories to select a random one
      const allCategories = await fetchCategories();
      const nonFavoriteCategories = allCategories.filter(
        (cat) => cat !== favChallenge1 && cat !== favChallenge2
      );
      
      // Select a random category
      const randomCategory = nonFavoriteCategories.length > 0
        ? nonFavoriteCategories[Math.floor(Math.random() * nonFavoriteCategories.length)]
        : allCategories[0];

      // Create 3 decks: 2 favorite challenges + 1 random
      await Promise.all([
        createDeck(user.id, favChallenge1),
        createDeck(user.id, favChallenge2),
        createDeck(user.id, randomCategory),
      ]);
      
      showAlert('Success', 'Account created successfully! Your challenges are ready. Please log in.', () => {
        router.back();
      });
    } catch (error) {
      showAlert('Registration Failed', error instanceof Error ? error.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MorphingLoadingScreen visible={loading} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Create Account</Text>

          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={COLORS.teal}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
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

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor={COLORS.teal}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <View style={styles.challengeContainer}>
            <Text style={styles.challengeLabel}>Favorite Challenge 1</Text>
            <View style={styles.categoryGrid}>
              {availableCategories.map((cat) => (
                <TouchableOpacity
                  key={`fav1-${cat.value}`}
                  style={[
                    styles.categoryButton,
                    favChallenge1 === cat.value && styles.categoryButtonSelected
                  ]}
                  onPress={() => setFavChallenge1(cat.value)}
                  disabled={loading}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    favChallenge1 === cat.value && styles.categoryButtonTextSelected
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.challengeContainer}>
            <Text style={styles.challengeLabel}>Favorite Challenge 2</Text>
            <View style={styles.categoryGrid}>
              {availableCategories.map((cat) => (
                <TouchableOpacity
                  key={`fav2-${cat.value}`}
                  style={[
                    styles.categoryButton,
                    favChallenge2 === cat.value && styles.categoryButtonSelected
                  ]}
                  onPress={() => setFavChallenge2(cat.value)}
                  disabled={loading}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    favChallenge2 === cat.value && styles.categoryButtonTextSelected
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Avatar Picker */}
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarLabel}>Choose Your Avatar</Text>
            
            {/* Category Selection */}
            <View style={styles.avatarCategoryGrid}>
              {(Object.keys(AVATAR_CATEGORIES) as CategoryName[]).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.avatarCategoryButton,
                    selectedCategory === category && styles.avatarCategoryButtonSelected
                  ]}
                  onPress={() => handleCategorySelect(category)}
                  disabled={loading}
                >
                  <Text style={[
                    styles.avatarCategoryButtonText,
                    selectedCategory === category && styles.avatarCategoryButtonTextSelected
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Avatar Display with Navigation */}
            {selectedCategory && shuffledAvatars.length > 0 && (
              <View style={styles.avatarDisplayContainer}>
                <TouchableOpacity
                  style={[
                    styles.avatarNavButton,
                    currentAvatarIndex === 0 && styles.avatarNavButtonDisabled
                  ]}
                  onPress={handlePreviousAvatar}
                  disabled={currentAvatarIndex === 0 || loading}
                >
                  <Text style={styles.avatarNavButtonText}>←</Text>
                </TouchableOpacity>

                <Animated.View 
                  style={[
                    styles.avatarImageContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateX: slideAnim }],
                    },
                  ]}
                >
                  <Image
                    source={shuffledAvatars[currentAvatarIndex]}
                    style={styles.avatarImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.avatarCounter}>
                    {currentAvatarIndex + 1} / {shuffledAvatars.length}
                  </Text>
                </Animated.View>

                <TouchableOpacity
                  style={[
                    styles.avatarNavButton,
                    currentAvatarIndex === shuffledAvatars.length - 1 && styles.avatarNavButtonDisabled
                  ]}
                  onPress={handleNextAvatar}
                  disabled={currentAvatarIndex === shuffledAvatars.length - 1 || loading}
                >
                  <Text style={styles.avatarNavButtonText}>→</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleCreateAccount} 
            disabled={loading}
            testID="create-button"
          >
            <Text style={styles.buttonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.toggleText}>
              Already have an account? Go back to login
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </>
  );
}

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
    alignItems: 'center',
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
    justifyContent: 'center',
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
  avatarContainer: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  avatarLabel: {
    color: COLORS.mint,
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '600',
  },
  avatarCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
    justifyContent: 'center',
  },
  avatarCategoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.tealDark,
    borderWidth: 2,
    borderColor: COLORS.tealDark,
  },
  avatarCategoryButtonSelected: {
    backgroundColor: COLORS.mint,
    borderColor: COLORS.mint,
  },
  avatarCategoryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  avatarCategoryButtonTextSelected: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  avatarDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  avatarNavButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarNavButtonDisabled: {
    backgroundColor: COLORS.tealDark,
    opacity: 0.5,
  },
  avatarNavButtonText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  avatarImageContainer: {
    alignItems: 'center',
  },
  avatarImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: COLORS.mint,
  },
  avatarCounter: {
    color: COLORS.teal,
    fontSize: 14,
    marginTop: 8,
  },
});
