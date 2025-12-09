import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';

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

  if (loading) {
    return <div style={styles.loading}>Loading leaderboards...</div>;
  }

  if (error) {
    return <div style={styles.error}>Error: {error}</div>;
  }

  const showGlobalUser = currentUser && !isUserInLeaderboard(globalLeaderboard, currentUser.id);
  const showFriendsUser = currentUser && !isUserInLeaderboard(friendsLeaderboard, currentUser.id);

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Leaderboards</h1>

      {/* GLOBAL LEADERBOARD */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Global Leaderboard</h2>

        <ol style={styles.list}>
          {globalLeaderboard.map((user, index) => (
            <li key={user.id} style={styles.listItem}>
              <span style={styles.rankBadge}>{index + 1}</span>
              <span style={styles.username}>{user.username}</span>
              <span style={styles.points}>{user.points} pts</span>
            </li>
          ))}
        </ol>

        {/* Player Rank Below List */}
        {showGlobalUser && currentUser && (
          <div style={styles.currentUser}>
            <p style={styles.ellipsis}>•••</p>
            <p style={styles.currentUserText}>
              {globalRank}. {currentUser.username} — {currentUser.points} pts
            </p>
          </div>
        )}
      </div>

      {/* FRIENDS LEADERBOARD */}
      <div style={styles.section}>
        {friendsLeaderboard.length === 0 ? (
          <p style={styles.emptyText}>No friends leaderboard available</p>
        ) : (
          <>
            <h2 style={styles.sectionTitle}>Friends Leaderboard</h2>

            <ol style={styles.list}>
              {friendsLeaderboard.map((user, index) => (
                <li key={user.id} style={styles.listItem}>
                  <span style={styles.rankBadge}>{index + 1}</span>
                  <span style={styles.username}>{user.username}</span>
                  <span style={styles.points}>{user.points} pts</span>
                </li>
              ))}
            </ol>

            {showFriendsUser && currentUser && (
              <div style={styles.currentUser}>
                <p style={styles.ellipsis}>•••</p>
                <p style={styles.currentUserText}>
                  {friendsRank}. {currentUser.username} —{' '}
                  {currentUser.points} pts
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '30px',
    minHeight: '100%',
    backgroundColor: '#15292E',
    color: '#FFFFFF',
    fontFamily: 'Inter, Arial, sans-serif',
  },

  header: {
    fontSize: '36px',
    fontWeight: '800',
    marginBottom: '32px',
    color: '#7AD7C3',
    textAlign: 'center',
    letterSpacing: '1.5px',
    textShadow: '0 0 14px rgba(122, 215, 195, 0.35)',
  },

  section: {
    marginBottom: '42px',
    backgroundColor: '#1D3A40',
    padding: '22px',
    borderRadius: '18px',
    border: '1px solid #26494F',
    boxShadow: '0 5px 14px rgba(0,0,0,0.35)',
  },

  sectionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#7AD7C3',
    letterSpacing: '1px',
  },

  list: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },

  listItem: {
    backgroundColor: '#0E2226',
    marginBottom: '12px',
    padding: '16px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    border: '1px solid #26494F',
    boxShadow: '0 3px 8px rgba(0, 0, 0, 0.35)',
  },

  rankBadge: {
    backgroundColor: '#7AD7C3',
    color: '#0E2226',
    fontWeight: '700',
    padding: '6px 12px',
    borderRadius: '10px',
    minWidth: '34px',
    textAlign: 'center',
    fontSize: '16px',
  },

  username: {
    flex: 1,
    fontSize: '18px',
    fontWeight: '500',
    color: '#FFFFFF',
  },

  points: {
    fontWeight: '700',
    fontSize: '16px',
    color: '#7AD7C3',
  },

  currentUser: {
    marginTop: '14px',
    padding: '16px',
    backgroundColor: '#1DA27E',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
  },

  currentUserText: {
    fontWeight: '700',
    fontSize: '17px',
    margin: 0,
    color: '#0E2226',
  },

  ellipsis: {
    margin: 0,
    fontSize: '22px',
    color: '#FFFFFF',
    opacity: 0.6,
  },

  emptyText: {
    color: '#A0C4C4',
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: '16px',
  },

  loading: {
    color: 'white',
    fontSize: '20px',
    textAlign: 'center',
    marginTop: '40px',
  },

  error: {
    color: '#FF6B6B',
    fontSize: '20px',
    textAlign: 'center',
    marginTop: '40px',
  },
};
