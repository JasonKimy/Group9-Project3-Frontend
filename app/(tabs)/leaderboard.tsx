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
    return <div>Loading leaderboards...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const showGlobalUser = currentUser && !isUserInLeaderboard(globalLeaderboard, currentUser.id);
  const showFriendsUser = currentUser && !isUserInLeaderboard(friendsLeaderboard, currentUser.id);

  return (
    <div>
      <h1>Leaderboards</h1>
      
      <div>
        <h2>Global Leaderboard</h2>
        <ol>
          {globalLeaderboard.map((user, index) => (
            <li key={user.id}>
              {user.username} - {user.points} points
            </li>
          ))}
        </ol>
        {showGlobalUser && (
          <div>
            <p>...</p>
            {/* If the user is tied with somebody in the top 5 we should say they're 6th*/}
            {/* EG if everyone is tied for 0 points (like right now during testing) */}
            {/* it will say the top 5 and then potentially put us under other users, but say we're #1*/}
            <p>{globalRank > 5 ? (globalRank) : (6)}. {currentUser.username} - {currentUser.points} points</p>
          </div>
        )}
      </div>
      
      <div>
        {friendsLeaderboard.length === 0 ? (
            <p></p>
        ) : (
          <>
          <h2>Friends Leaderboard</h2>
            <ol>
              {friendsLeaderboard.map((user, index) => (
                <li key={user.id}>
                  {user.username} - {user.points} points
                </li>
              ))}
            </ol>
            {showFriendsUser && (
              <div>
                <p>...</p>
                <p>{friendsRank > 5 ? (friendsRank) : (6)}. {currentUser.username} - {currentUser.points} points</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}