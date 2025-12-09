import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MorphingLoadingScreen from '../components/MorphingLoadingScreen';

// API base URL - should match the backend deployment
const API_BASE_URL = 'https://wander-api-196ebd783842.herokuapp.com/api';

interface Friend {
  id: string;
  username: string;
  friend_1_id: string;
  friend_2_id: string;
  status: string;
}

interface User {
  id: string;
  username: string;
  email: string;
// ... other user fields
}

export default function Friends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<Friend[]>([]);
  const [blocked, setBlocked] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setuserId] = useState<string | null>(null);
  const [friendUsername, setFriendUsername] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        setuserId(user.id);
      }
    };
    loadUser();
  }, []);

  const fetchFriends = async () => {
    if (!userId) return;
    try {
      // Fetch friends using the user's ID
      const response1 = await fetch(`${API_BASE_URL}/friends/${userId}`);
      const response2 = await fetch(`${API_BASE_URL}/friends/sent/${userId}`);
      const response3 = await fetch(`${API_BASE_URL}/friends/incoming/${userId}`);
      const response4 = await fetch(`${API_BASE_URL}/friends/blocked/${userId}`);
      
      const friends = [...await response1.json()];
      const pending = [...await response2.json()];
      const incoming = [...await response3.json()];
      const blocked = [...await response4.json()];

      for (let i = 0; i < friends.length; i++) {
        const userResponse = await fetch(`${API_BASE_URL}/users/${friends[i].friend_2_id}`);
        const user = await userResponse.json();
        friends[i].username = user.username;
      }
      
      for (let i = 0; i < pending.length; i++) {
        const userResponse = await fetch(`${API_BASE_URL}/users/${pending[i].friend_2_id}`);
        const user = await userResponse.json();
        pending[i].username = user.username;
      }
      
      for (let i = 0; i < incoming.length; i++) {
        const userResponse = await fetch(`${API_BASE_URL}/users/${incoming[i].friend_1_id}`);
        const user = await userResponse.json();
        incoming[i].username = user.username;
      }

      for (let i = 0; i < blocked.length; i++) {
        const userResponse = await fetch(`${API_BASE_URL}/users/${blocked[i].friend_2_id}`);
        const user = await userResponse.json();
        blocked[i].username = user.username;
      }
      
      setFriends(friends);
      setPending(pending);
      setIncoming(incoming);
      setBlocked(blocked);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [userId]);

  const sendFriendRequest = async (friendUser: string) => {
    try {
      const userNameResponse = await fetch(`${API_BASE_URL}/users/username/${friendUser}`);
      const data = await userNameResponse.json();
        console.log(data);
        console.log('Sending:', { senderId: userId, receiverId: data.id });
        const requestResponse = await fetch(`${API_BASE_URL}/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: userId, receiverId: data.id })
      });
      // Refresh the friends list after accepting
      fetchFriends();
    } catch {
      setError('An error occurred while sending friend request');
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
        console.log(requestId, userId);
        const acceptResponse = await fetch(`${API_BASE_URL}/friends/accept/${requestId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accepterId: userId })
          });
        
        if (acceptResponse.ok) {
          // Refresh the friends list after accepting
          await fetchFriends();
        } else {
          const errorText = await acceptResponse.text();
          setError(`Failed to accept friend request: ${errorText}`);
        }
    } catch (err) {
        setError('An error occurred while accepting friend request');
        console.error('Accept friend error:', err);
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
        console.log(requestId, userId);
        const rejectResponse = await fetch(`${API_BASE_URL}/friends/reject/${requestId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rejecterId: userId })
          });
        
        if (rejectResponse.ok) {
          // Refresh the friends list after rejecting
          await fetchFriends();
        } else {
          const errorText = await rejectResponse.text();
          setError(`Failed to reject friend request: ${errorText}`);
        }
    } catch (err) {
        setError('An error occurred while rejecting friend request');
        console.error('Reject friend error:', err);
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      console.log(friendId, userId);
        const response = await fetch(`${API_BASE_URL}/friends/${friendId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId })
        });
        
        if (response.ok) {
          // Refresh the friends list after removing
          await fetchFriends();
        } else {
          const errorText = await response.text();
          setError(`Failed to remove friend: ${errorText}`);
        }
    } catch (err) {
        setError('An error occurred while removing friend');
        console.error('Remove friend error:', err);
    }
  };

  const block = async (blockedId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockerId: userId, blockedUserId: blockedId })
      });
      
      if (response.ok) {
        // Refresh the friends list after blocking
        await fetchFriends();
      } else {
        const errorText = await response.text();
        setError(`Failed to block user: ${errorText}`);
      }
    } catch (err) {
      setError('An error occurred while blocking user');
      console.error('Block user error:', err);
    }
  };

  const unblock = async (blockedId: string) => {
console.log('User ID:', userId);
    console.log('Unblocking:', blockedId);
    try {
      console.log(blockedId, userId);
        const response = await fetch(`${API_BASE_URL}/friends/unblock/${blockedId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId })
        });
        
        if (response.ok) {
          // Refresh the friends list after unblocking
          await fetchFriends();
        } else {
          const errorText = await response.text();
          setError(`Failed to unblock user: ${errorText}`);
        }
    } catch (err) {
        setError('An error occurred while unblocking user');
        console.error('Unblock user error:', err);
    }
  };

  const styles = StyleSheet.create({
    background: {
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
    card: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      marginBottom: 12,
      backgroundColor: '#0E2226',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#26494F',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 8,
    },
    username: {
      fontSize: 18,
      fontWeight: '500',
      color: '#FFFFFF',
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
    },
    buttonPrimary: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: '#7AD7C3',
      borderRadius: 6,
    },
    buttonPrimaryText: {
      color: '#0E2226',
      fontSize: 14,
      fontWeight: '600',
    },
    buttonSecondary: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: '#26494F',
      borderRadius: 6,
    },
    buttonSecondaryText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    buttonDanger: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: '#CC4444',
      borderRadius: 6,
    },
    buttonDangerText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    empty: {
      fontSize: 16,
      color: '#A0C4C4',
      fontStyle: 'italic',
      textAlign: 'center',
    },
    addContainer: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 10,
      alignItems: 'center',
    },
    input: {
      flex: 1,
      padding: 10,
      paddingHorizontal: 15,
      fontSize: 16,
      borderWidth: 1,
      borderColor: '#26494F',
      borderRadius: 6,
      backgroundColor: '#0E2226',
      color: '#FFFFFF',
    },
  });

  if (error) return <View style={styles.error}><Text style={styles.errorText}>Error: {error}</Text></View>;

  const Section = ({ title, children }: any) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View>{children}</View>
    </View>
  );

  const ListItem = ({ children }: any) => (
    <View style={styles.card}>
      {children}
    </View>
  );

  return (
    <>
      <MorphingLoadingScreen visible={loading} />
      <View style={styles.background}>
        <ScrollView style={styles.scrollContainer}>
          <Text style={styles.header}>My Friends</Text>

      {/* FRIENDS */}
      <Section title="Friends">
        {friends.length === 0 ? (
          <Text style={styles.empty}>No friends</Text>
        ) : (
          friends.map(friend => (
            <ListItem key={friend.id}>
              <Text style={styles.username}>{friend.username}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.buttonDanger} onPress={() => removeFriend(friend.friend_2_id)}><Text style={styles.buttonDangerText}>Remove</Text></TouchableOpacity>
                <TouchableOpacity style={styles.buttonSecondary} onPress={() => block(friend.friend_1_id)}><Text style={styles.buttonSecondaryText}>Block</Text></TouchableOpacity>
              </View>
            </ListItem>
          ))
        )}
      </Section>

      {/* PENDING */}
      <Section title="Pending Requests">
        {pending.length === 0 ? (
          <Text style={styles.empty}>No pending requests</Text>
        ) : (
          pending.map(p => (
            <ListItem key={p.id}>
              <Text style={styles.username}>{p.username}</Text>
              <TouchableOpacity style={styles.buttonSecondary} onPress={() => removeFriend(p.friend_2_id)}><Text style={styles.buttonSecondaryText}>Cancel</Text></TouchableOpacity>
            </ListItem>
          ))
        )}
      </Section>

      {/* INCOMING */}
      <Section title="Incoming Requests">
        {incoming.length === 0 ? (
          <Text style={styles.empty}>No incoming requests</Text>
        ) : (
          incoming.map(request => (
            <ListItem key={request.id}>
              <Text style={styles.username}>{request.username}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.buttonPrimary} onPress={() => acceptFriendRequest(request.id)}><Text style={styles.buttonPrimaryText}>Accept</Text></TouchableOpacity>
                <TouchableOpacity style={styles.buttonDanger} onPress={() => rejectFriendRequest(request.id)}><Text style={styles.buttonDangerText}>Reject</Text></TouchableOpacity>
                <TouchableOpacity style={styles.buttonSecondary} onPress={() => block(request.friend_1_id)}><Text style={styles.buttonSecondaryText}>Block</Text></TouchableOpacity>
              </View>
            </ListItem>
          ))
        )}
      </Section>

      {/* BLOCKED */}
      <Section title="Blocked Users">
        {blocked.length === 0 ? (
          <Text style={styles.empty}>No blocked users</Text>
        ) : (
          blocked.map(b => (
            <ListItem key={b.id}>
              <Text style={styles.username}>{b.username}</Text>
              <TouchableOpacity style={styles.buttonPrimary} onPress={() => unblock(b.friend_2_id)}><Text style={styles.buttonPrimaryText}>Unblock</Text></TouchableOpacity>
            </ListItem>
          ))
        )}
      </Section>

      {/* ADD FRIEND */}
      <Text style={styles.sectionTitle}>Add a Friend</Text>
      <View style={styles.addContainer}>
        <TextInput placeholder="Enter username" placeholderTextColor="#A0C4C4" style={styles.input} value={friendUsername} onChangeText={setFriendUsername} />
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => {
            sendFriendRequest(friendUsername);
            setFriendUsername('');
          }}
        >
          <Text style={styles.buttonPrimaryText}>Send Request</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
    </>
  );
}