import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { User, updateUserFavoriteChallenges, updateUserAvatar, updateUserDecks, getUserCheckIns, fetchPlaceById, Place } from '../services/api';
import MorphingLoadingScreen from '../components/MorphingLoadingScreen';

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
    require('../../assets/Wander-Avatars/Astro/Astro1.png'),
    require('../../assets/Wander-Avatars/Astro/Astro2.png'),
    require('../../assets/Wander-Avatars/Astro/Astro3.png'),
    require('../../assets/Wander-Avatars/Astro/Astro4.png'),
    require('../../assets/Wander-Avatars/Astro/Astro5.png'),
  ],
  Cowboy: [
    require('../../assets/Wander-Avatars/Cowboy/Cowboy1.png'),
    require('../../assets/Wander-Avatars/Cowboy/Cowboy2.png'),
    require('../../assets/Wander-Avatars/Cowboy/Cowboy3.png'),
    require('../../assets/Wander-Avatars/Cowboy/Cowboy4.png'),
  ],
  KPOP: [
    require('../../assets/Wander-Avatars/KPOP/KPOP1.png'),
    require('../../assets/Wander-Avatars/KPOP/KPOP2.png'),
    require('../../assets/Wander-Avatars/KPOP/KPOP3.png'),
    require('../../assets/Wander-Avatars/KPOP/KPOP4.png'),
    require('../../assets/Wander-Avatars/KPOP/KPOP5.png'),
    require('../../assets/Wander-Avatars/KPOP/KPOP6.png'),
    require('../../assets/Wander-Avatars/KPOP/KPOP7.png'),
  ],
  Normal: [
    require('../../assets/Wander-Avatars/Normal/normal1.png'),
    require('../../assets/Wander-Avatars/Normal/normal2.png'),
    require('../../assets/Wander-Avatars/Normal/normal3.png'),
    require('../../assets/Wander-Avatars/Normal/normal4.png'),
    require('../../assets/Wander-Avatars/Normal/normal5.png'),
    require('../../assets/Wander-Avatars/Normal/normal6.png'),
    require('../../assets/Wander-Avatars/Normal/normal7.png'),
    require('../../assets/Wander-Avatars/Normal/normal8.png'),
    require('../../assets/Wander-Avatars/Normal/normal9.png'),
    require('../../assets/Wander-Avatars/Normal/normal10.png'),
    require('../../assets/Wander-Avatars/Normal/normal11.png'),
    require('../../assets/Wander-Avatars/Normal/normal12.png'),
  ],
  Viking: [
    require('../../assets/Wander-Avatars/Viking/Viking1.png'),
    require('../../assets/Wander-Avatars/Viking/Viking2.png'),
    require('../../assets/Wander-Avatars/Viking/Viking3.png'),
    require('../../assets/Wander-Avatars/Viking/Viking4.png'),
  ],
};

type CategoryName = keyof typeof AVATAR_CATEGORIES;

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

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Get avatar image from path string
const getAvatarImage = (avatarPath?: string) => {
  if (!avatarPath) {
    return AVATAR_CATEGORIES.Normal[0];
  }

  // Parse path like "../assets/Wander-Avatars/Viking/Viking4.png"
  const match = avatarPath.match(/Wander-Avatars\/(\w+)\/(\w+)(\d+)\.png/);
  if (!match) {
    return AVATAR_CATEGORIES.Normal[0];
  }

  const [, category, , index] = match;
  const categoryKey = category as CategoryName;
  const imageIndex = parseInt(index) - 1; // Convert to 0-based index

  if (AVATAR_CATEGORIES[categoryKey] && AVATAR_CATEGORIES[categoryKey][imageIndex]) {
    return AVATAR_CATEGORIES[categoryKey][imageIndex];
  }

  return AVATAR_CATEGORIES.Normal[0];
};

const API_BASE_URL = 'https://wander-api-196ebd783842.herokuapp.com/api';

interface Friend {
  id: string;
  friend_1_id: string;
  friend_2_id: string;
  status: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkInCount, setCheckInCount] = useState(0);
  const [friendCount, setFriendCount] = useState(0);
  const [topPlace, setTopPlace] = useState<{ place: Place; level: number } | null>(null);

  // Modal states
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [challengeModalVisible, setChallengeModalVisible] = useState(false);

  // Avatar picker state
  const [selectedCategory, setSelectedCategory] = useState<CategoryName>('Normal');
  const [shuffledAvatars, setShuffledAvatars] = useState<any[]>([]);
  const [currentAvatarIndex, setCurrentAvatarIndex] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState<any>(null);

  // Challenge selection state
  const [tempFavChallenge1, setTempFavChallenge1] = useState('');
  const [tempFavChallenge2, setTempFavChallenge2] = useState('');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Available categories for challenges
  const availableCategories = [
    { label: 'Coffee Shop', value: 'coffee_shop' },
    { label: 'Gym', value: 'gym' },
    { label: 'Park', value: 'park' },
    { label: 'Beach', value: 'beach' },
    { label: 'Trail', value: 'trail' },
  ];

  // Initialize with Normal category on mount
  useEffect(() => {
    const initialShuffled = shuffleArray(AVATAR_CATEGORIES['Normal']);
    setShuffledAvatars(initialShuffled);
    setSelectedAvatar(initialShuffled[0]);
  }, []);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) {
        router.replace('/LoginScreen');
        return;
      }

      const userData: User = JSON.parse(userJson);
      setUser(userData);

      // Initialize temp challenge states with current values
      setTempFavChallenge1(userData.fav_challenge_1 || '');
      setTempFavChallenge2(userData.fav_challenge_2 || '');

      // Fetch check-in count and find top place
      const checkIns = await getUserCheckIns(userData.id);
      setCheckInCount(checkIns.length);

      // Group check-ins by place to find the most visited
      if (checkIns.length > 0) {
        const placeMap = new Map<string, number>();
        checkIns.forEach(checkIn => {
          placeMap.set(checkIn.placeId, (placeMap.get(checkIn.placeId) || 0) + 1);
        });

        // Find the place with the most visits
        let maxVisits = 0;
        let topPlaceId = '';
        placeMap.forEach((count, placeId) => {
          if (count > maxVisits) {
            maxVisits = count;
            topPlaceId = placeId;
          }
        });

        // Fetch the place details
        if (topPlaceId) {
          try {
            const place = await fetchPlaceById(topPlaceId);
            setTopPlace({ place, level: maxVisits });
          } catch (err) {
            console.error('Error fetching top place:', err);
          }
        }
      }

      // Fetch friend count
      const friendsResponse = await fetch(`${API_BASE_URL}/friends/${userData.id}`);
      if (friendsResponse.ok) {
        const friends: Friend[] = await friendsResponse.json();
        setFriendCount(friends.length);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCategoryName = (category: string): string => {
    return category
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

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

  const handleSaveAvatar = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Find the original index in the unshuffled category array
      const originalIndex = AVATAR_CATEGORIES[selectedCategory].indexOf(selectedAvatar);
      const avatarUrl = `../assets/Wander-Avatars/${selectedCategory}/${selectedCategory}${originalIndex + 1}.png`;
      
      // Update backend
      const updatedUser = await updateUserAvatar(user.id, avatarUrl);
      
      // Update local state and AsyncStorage
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      setAvatarModalVisible(false);
      showAlert('Success', 'Avatar updated successfully!');
    } catch (error) {
      console.error('Error updating avatar:', error);
      showAlert('Error', 'Failed to update avatar. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChallenges = async () => {
    if (!user) return;

    // Validate selections
    if (!tempFavChallenge1 || !tempFavChallenge2) {
      showAlert('Error', 'Please select both favorite challenges');
      return;
    }

    if (tempFavChallenge1 === tempFavChallenge2) {
      showAlert('Error', 'Please select two different challenges');
      return;
    }

    try {
      setLoading(true);
      
      // Store old challenges for deck update
      const oldFavChallenge1 = user.fav_challenge_1 || '';
      const oldFavChallenge2 = user.fav_challenge_2 || '';
      
      // Update backend
      const updatedUser = await updateUserFavoriteChallenges(
        user.id,
        tempFavChallenge1,
        tempFavChallenge2
      );
      
      // Update decks to match new favorite challenges
      await updateUserDecks(
        user.id,
        oldFavChallenge1,
        oldFavChallenge2,
        tempFavChallenge1,
        tempFavChallenge2
      );
      
      // Update local state and AsyncStorage
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      setChallengeModalVisible(false);
      showAlert('Success', 'Favorite challenges and decks updated successfully!');
    } catch (error) {
      console.error('Error updating challenges:', error);
      showAlert('Error', 'Failed to update challenges. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    router.replace('/LoginScreen');
  };

  const openAvatarModal = () => {
    setAvatarModalVisible(true);
  };

  const openChallengeModal = () => {
    // Reset temp values to current user values
    setTempFavChallenge1(user?.fav_challenge_1 || '');
    setTempFavChallenge2(user?.fav_challenge_2 || '');
    setChallengeModalVisible(true);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <MorphingLoadingScreen visible={loading} />
      <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Profile</Text>

        {/* Avatar Section */}
        <TouchableOpacity testID="avatar-button" onPress={openAvatarModal} style={styles.avatarContainer}>
          <Image
            source={getAvatarImage(user.avatar_url)}
            style={styles.avatarImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Username */}
        <Text style={styles.username}>{user.username}</Text>

        {/* Favorite Challenges Section */}
        <TouchableOpacity onPress={openChallengeModal} style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Favorite Challenges</Text>
          <View style={styles.challengesDisplay}>
            <View style={styles.challengeItem}>
              <Text style={styles.challengeNumber}>1.</Text>
              <Text style={styles.challengeText}>
                {user.fav_challenge_1 ? formatCategoryName(user.fav_challenge_1) : 'Not set'}
              </Text>
            </View>
            <View style={styles.challengeItem}>
              <Text style={styles.challengeNumber}>2.</Text>
              <Text style={styles.challengeText}>
                {user.fav_challenge_2 ? formatCategoryName(user.fav_challenge_2) : 'Not set'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{checkInCount}</Text>
            <Text style={styles.statLabel}>Places Visited</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{friendCount}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
        </View>

        {/* Top Place Section */}
        {topPlace && (
          <View style={styles.topPlaceContainer}>
            <Text style={styles.topPlaceTitle}>Most Visited Place</Text>
            <View style={styles.topPlaceCard}>
              <View style={styles.topPlaceHeader}>
                <Text style={styles.topPlaceName}>{topPlace.place.name}</Text>
                <View style={styles.topLevelBadge}>
                  <Text style={styles.topLevelText}>Level {topPlace.level}</Text>
                </View>
              </View>
              <Text style={styles.topPlaceCategory}>
                {formatCategoryName(topPlace.place.category)} • {topPlace.place.city}
              </Text>
              <Text style={styles.topPlaceDescription} numberOfLines={2}>
                {topPlace.place.description}
              </Text>
            </View>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Avatar Selection Modal */}
      <Modal
        visible={avatarModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Your Avatar</Text>

            {/* Category Selection */}
            <View style={styles.avatarCategoryGrid}>
              {(Object.keys(AVATAR_CATEGORIES) as CategoryName[]).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.avatarCategoryButton,
                    selectedCategory === category && styles.avatarCategoryButtonSelected,
                  ]}
                  onPress={() => handleCategorySelect(category)}
                >
                  <Text
                    style={[
                      styles.avatarCategoryButtonText,
                      selectedCategory === category && styles.avatarCategoryButtonTextSelected,
                    ]}
                  >
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
                    currentAvatarIndex === 0 && styles.avatarNavButtonDisabled,
                  ]}
                  onPress={handlePreviousAvatar}
                  disabled={currentAvatarIndex === 0}
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
                    style={styles.modalAvatarImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.avatarCounter}>
                    {currentAvatarIndex + 1} / {shuffledAvatars.length}
                  </Text>
                </Animated.View>

                <TouchableOpacity
                  style={[
                    styles.avatarNavButton,
                    currentAvatarIndex === shuffledAvatars.length - 1 &&
                      styles.avatarNavButtonDisabled,
                  ]}
                  onPress={handleNextAvatar}
                  disabled={currentAvatarIndex === shuffledAvatars.length - 1}
                >
                  <Text style={styles.avatarNavButtonText}>→</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setAvatarModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveAvatar}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Challenge Selection Modal */}
      <Modal
        visible={challengeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChallengeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Favorite Challenges</Text>

            <ScrollView style={styles.challengeModalScroll}>
              <View style={styles.challengeContainer}>
                <Text style={styles.challengeLabel}>Favorite Challenge 1</Text>
                <View style={styles.categoryGrid}>
                  {availableCategories.map((cat) => (
                    <TouchableOpacity
                      key={`fav1-${cat.value}`}
                      style={[
                        styles.categoryButton,
                        tempFavChallenge1 === cat.value && styles.categoryButtonSelected,
                      ]}
                      onPress={() => setTempFavChallenge1(cat.value)}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          tempFavChallenge1 === cat.value && styles.categoryButtonTextSelected,
                        ]}
                      >
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
                        tempFavChallenge2 === cat.value && styles.categoryButtonSelected,
                      ]}
                      onPress={() => setTempFavChallenge2(cat.value)}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          tempFavChallenge2 === cat.value && styles.categoryButtonTextSelected,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setChallengeModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveChallenges}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.darkBlue,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.mint,
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.mint,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 30,
  },
  sectionContainer: {
    width: '100%',
    backgroundColor: COLORS.tealDark,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.mint,
    marginBottom: 12,
  },
  challengesDisplay: {
    gap: 10,
  },
  challengeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkBlue,
    borderRadius: 8,
    padding: 12,
  },
  challengeNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.mint,
    marginRight: 10,
  },
  challengeText: {
    fontSize: 16,
    color: COLORS.white,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: COLORS.tealDark,
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.teal,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.mint,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.white,
    textAlign: 'center',
  },
  topPlaceContainer: {
    width: '100%',
    marginBottom: 30,
  },
  topPlaceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.mint,
    marginBottom: 12,
    textAlign: 'center',
  },
  topPlaceCard: {
    backgroundColor: COLORS.tealDark,
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: COLORS.mint,
  },
  topPlaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  topPlaceName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.mint,
    flex: 1,
    marginRight: 8,
  },
  topLevelBadge: {
    backgroundColor: COLORS.mint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  topLevelText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '700',
  },
  topPlaceCategory: {
    fontSize: 14,
    color: COLORS.teal,
    fontWeight: '500',
    marginBottom: 8,
  },
  topPlaceDescription: {
    fontSize: 15,
    color: COLORS.white,
    opacity: 0.85,
    lineHeight: 21,
  },
  logoutButton: {
    width: '100%',
    padding: 16,
    borderRadius: 10,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    marginTop: 'auto',
  },
  logoutButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.darkBlue,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.mint,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: COLORS.tealDark,
  },
  modalButtonSave: {
    backgroundColor: COLORS.mint,
  },
  modalButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Avatar modal styles
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
    marginBottom: 10,
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
  modalAvatarImage: {
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
  // Challenge modal styles
  challengeModalScroll: {
    maxHeight: 400,
  },
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
});
