import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import MorphingLoadingScreen from '../components/MorphingLoadingScreen';

interface User {
  id: string;
  username: string;
  points: number;
}

export default function Leaderboard() {
  const [globalLeaderboard, setGlobalLeaderboard] = useState<User[]>([]);
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [globalRank, setGlobalRank] = useState<number>(-1);
  const [friendsRank, setFriendsRank] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserAndFetchLeaderboards = async () => {
      try {
        setLoading(true);

        const userJson = await AsyncStorage.getItem('user');
        if (!userJson) {
          setError('No user logged in');
          setLoading(false);
          return;
        }

        const user = JSON.parse(userJson);
        setCurrentUser(user);

        // Fetch leaderboards and our ranks on each
        const globalResponse = await fetch('https://wander-api-196ebd783842.herokuapp.com/api/users/leaderboard/global?limit=5');
        const globalData = await globalResponse.json();
        setGlobalLeaderboard(globalData);

        const friendsResponse = await fetch(`https://wander-api-196ebd783842.herokuapp.com/api/users/leaderboard/friends/${user.id}?limit=5`);
        const friendsData = await friendsResponse.json();
        setFriendsLeaderboard(friendsData);

        const globalRankResponse = await fetch(`https://wander-api-196ebd783842.herokuapp.com/api/users/leaderboard/global/rank/${user.id}`);
        const globalRankData = await globalRankResponse.json();
        setGlobalRank(globalRankData);

        const friendsRankResponse = await fetch(`https://wander-api-196ebd783842.herokuapp.com/api/users/leaderboard/friends/rank/${user.id}`);
        const friendsRankData = await friendsRankResponse.json();
        setFriendsRank(friendsRankData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadUserAndFetchLeaderboards();
  }, []);

//   So we can display the user below the leaderboard if they're not in the top 5
  const isUserInLeaderboard = (leaderboard: User[], userId: string) => {
    return leaderboard.some(user => user.id === userId);
  };

  if (error) {
    return <View style={styles.error}><Text style={styles.errorText}>Error: {error}</Text></View>;
  }

  const showGlobalUser = currentUser && !isUserInLeaderboard(globalLeaderboard, currentUser.id);
  const showFriendsUser = currentUser && !isUserInLeaderboard(friendsLeaderboard, currentUser.id);

  return (
    <>
      <MorphingLoadingScreen visible={loading} />
      <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.header}>Leaderboards</Text>

        {/* GLOBAL LEADERBOARD */}
        <View style={styles.section}>
        <Text style={styles.sectionTitle}>Global Leaderboard</Text>

        <View style={styles.list}>
          {globalLeaderboard.map((user, index) => {
            const isCurrentUser = currentUser && user.id === currentUser.id;
            return (
              <View key={user.id} 
                style={[styles.listItem, isCurrentUser && styles.currentUser]}
              >
                <Text style={[styles.rankBadge, isCurrentUser && styles.userRank]}>
                  {index + 1}
                </Text>
                <Text style={[styles.username, isCurrentUser && styles.userUsername]}>
                  {user.username}
                </Text>
                <Text style={[styles.points, isCurrentUser && styles.userPoints]}>
                  {user.points} pts
                </Text>
              </View>
            );
          })}
        </View>

        {/* Player Rank Below List - Only show if NOT in top 5 */}
        {showGlobalUser && currentUser && globalRank > 5 && (
          <View>
            <Text style={styles.ellipsis}>•••</Text>
            <View style={styles.currentUser}>
              <View style={styles.userListItem}>
                <Text style={styles.userRank}>{globalRank}</Text>
                <Text style={styles.userUsername}>{currentUser.username}</Text>
                <Text style={styles.userPoints}>{currentUser.points} pts</Text>
              </View>
            </View>
          </View>
        )}

        {/* Player Rank Below List */}
        {showGlobalUser && currentUser && (
          <View>
            <Text style={styles.ellipsis}>•••</Text>
            <View style={styles.currentUser}>
              <View style={styles.userListItem}>
                <Text style={styles.userRank}>{globalRank > 5 ? globalRank : 6}</Text>
                <Text style={styles.userUsername}>{currentUser.username}</Text>
                <Text style={styles.userPoints}>{currentUser.points} pts</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* FRIENDS LEADERBOARD */}
        {friendsLeaderboard.length === 1 ||  friendsLeaderboard.length === 0 ? (
          <Text></Text>
        ) : (
          <View style={styles.section}>
          <>
          <Text style={styles.sectionTitle}>Friends Leaderboard</Text>

          <View style={styles.list}>
            {friendsLeaderboard.map((user, index) => {
              const isCurrentUser = currentUser && user.id === currentUser.id;
              
              return (
                <View key={user.id} 
                  style={[styles.listItem, isCurrentUser && styles.currentUser]}
                >
                  <Text style={[styles.rankBadge, isCurrentUser && styles.userRank]}>
                    {index + 1}
                  </Text>
                  <Text style={[styles.username, isCurrentUser && styles.userUsername]}>
                    {user.username}
                  </Text>
                  <Text style={[styles.points, isCurrentUser && styles.userPoints]}>
                    {user.points} pts
                  </Text>
                </View>
              );
            })}
          </View>

            {showFriendsUser && currentUser && (
              <View>
              <Text style={styles.ellipsis}>•••</Text>
                <View style={styles.currentUser}>
                  <View style={styles.userListItem}>
                    <Text style={styles.userRank}>{friendsRank > 5 ? friendsRank : 6}</Text>
                    <Text style={styles.userUsername}>{currentUser.username}</Text>
                    <Text style={styles.userPoints}>{currentUser.points} pts</Text>
                  </View>
                </View>
              </View>
            )}
          </>
          </View>
        )}
      </ScrollView>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#15292E',
  },

  scrollContainer: {
    flex: 1,
    padding: 30,
  },

  header: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 32,
    color: '#7AD7C3',
    textAlign: 'center',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(122, 215, 195, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },

  section: {
    marginBottom: 42,
    backgroundColor: '#1D3A40',
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#26494F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 14,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#7AD7C3',
    letterSpacing: 1,
  },

  list: {
    margin: 0,
    padding: 0,
  },

  listItem: {
    backgroundColor: '#0E2226',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#26494F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },

  rankBadge: {
    backgroundColor: '#7AD7C3',
    color: '#0E2226',
    fontWeight: '700',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    minWidth: 34,
    textAlign: 'center',
    fontSize: 16,
  },

  username: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
  },

  points: {
    fontWeight: '700',
    fontSize: 16,
    color: '#7AD7C3',
  },

  currentUser: {
    padding: 16,
    backgroundColor: '#1DA27E',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 14,
  },

  currentUserText: {
    fontWeight: '700',
    fontSize: 17,
    margin: 0,
    color: '#0E2226',
  },

  ellipsis: {
    margin: 0,
    fontSize: 22,
    color: '#FFFFFF',
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 12,
  },

  emptyText: {
    color: '#A0C4C4',
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: 16,
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },

  loadingText: {
    color: 'white',
    fontSize: 20,
  },

  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },

  errorText: {
    color: '#FF6B6B',
    fontSize: 20,
  },
  userListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userRank: {
    backgroundColor: '#1D3A40',
    color: '#FFFFFF',
    fontWeight: '700',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    minWidth: 34,
    textAlign: 'center',
    fontSize: 16,
  },
  userUsername: {
    flex: 1,
    fontWeight: '700',
    fontSize: 17,
    color: '#0E2226',
  },
  userPoints: {
    fontWeight: '700',
    fontSize: 17,
    color: '#0E2226',
  },
});