import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';

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

  useEffect(() => {
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
        body: JSON.stringify({ requestId: requestId, accepterId: userId })
      });
    } catch {
      setError('An error occurred while accepting friend request');
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
        console.log(requestId, userId);
        const rejectResponse = await fetch(`${API_BASE_URL}/friends/reject/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: requestId, rejecterId: userId })
      });
    } catch {
      setError('An error occurred while rejecting friend request');
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
    } catch {
      setError('An error occurred while removing friend');
    }
  };

  const block = async (blockedId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockerId: userId, blockedUserId: blockedId })
      });
    } catch {
      setError('An error occurred while blocking user');
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
    } catch {
      setError('An error occurred while removing friend');
    }
  };

  if (loading) return <div style={styles.loading}>Loading friends...</div>;
  if (error) return <div style={styles.error}>Error: {error}</div>;

  const Section = ({ title, children }: any) => (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <div>{children}</div>
    </div>
  );

  const ListItem = ({ children }: any) => (
    <div style={styles.card}>
      {children}
    </div>
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>My Friends</h1>

      {/* FRIENDS */}
      <Section title="Friends">
        {friends.length === 0 ? (
          <p style={styles.empty}>No friends</p>
        ) : (
          friends.map(friend => (
            <ListItem key={friend.id}>
              <span style={styles.username}>{friend.username}</span>
              <div style={styles.actions}>
                <button style={styles.buttonDanger} onClick={() => removeFriend(friend.friend_2_id)}>Remove</button>
                <button style={styles.buttonSecondary} onClick={() => block(friend.friend_1_id)}>Block</button>
              </div>
            </ListItem>
          ))
        )}
      </Section>

      {/* PENDING */}
      <Section title="Pending Requests">
        {pending.length === 0 ? (
          <p style={styles.empty}>No pending requests</p>
        ) : (
          pending.map(p => (
            <ListItem key={p.id}>
              <span style={styles.username}>{p.username}</span>
              <button style={styles.buttonSecondary} onClick={() => removeFriend(p.friend_2_id)}>Cancel</button>
            </ListItem>
          ))
        )}
      </Section>

      {/* INCOMING */}
      <Section title="Incoming Requests">
        {incoming.length === 0 ? (
          <p style={styles.empty}>No incoming requests</p>
        ) : (
          incoming.map(request => (
            <ListItem key={request.id}>
              <span style={styles.username}>{request.username}</span>
              <div style={styles.actions}>
                <button style={styles.buttonPrimary} onClick={() => acceptFriendRequest(request.id)}>Accept</button>
                <button style={styles.buttonDanger} onClick={() => rejectFriendRequest(request.id)}>Reject</button>
                <button style={styles.buttonSecondary} onClick={() => block(request.friend_1_id)}>Block</button>
              </div>
            </ListItem>
          ))
        )}
      </Section>

      {/* BLOCKED */}
      <Section title="Blocked Users">
        {blocked.length === 0 ? (
          <p style={styles.empty}>No blocked users</p>
        ) : (
          blocked.map(b => (
            <ListItem key={b.id}>
              <span style={styles.username}>{b.username}</span>
              <button style={styles.buttonPrimary} onClick={() => unblock(b.friend_2_id)}>Unblock</button>
            </ListItem>
          ))
        )}
      </Section>

      {/* ADD FRIEND */}
      <h2 style={styles.sectionTitle}>Add a Friend</h2>
      <div style={styles.addContainer}>
        <input id="friendUsername" placeholder="Enter username" style={styles.input} />
        <button
          style={styles.buttonPrimary}
          onClick={() => {
            const input = document.getElementById('friendUsername') as HTMLInputElement;
            sendFriendRequest(input.value);
            input.value = '';
          }}
        >
          Send Request
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '25px',
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: '#F6FFFF',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  },
  header: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#0A3D3F',
    marginBottom: '20px',
  },
  loading: { padding: 20 },
  error: { padding: 20, color: 'red' },

  section: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '22px',
    color: '#147A7E',
    marginBottom: '10px',
  },
  empty: {
    color: '#789',
    fontStyle: 'italic',
  },

  card: {
    backgroundColor: '#0A3D3F',
    padding: '14px 18px',
    marginBottom: '10px',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeft: '5px solid #2AB3B6',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },

  username: {
    color: 'white',
    fontWeight: 'bold',
  },

  actions: {
    display: 'flex',
    gap: '10px',
  },

  buttonPrimary: {
    backgroundColor: '#2AB3B6',
    color: 'white',
    padding: '6px 14px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
  },
  buttonSecondary: {
    backgroundColor: '#E2F4F4',
    color: '#0A3D3F',
    padding: '6px 14px',
    borderRadius: '8px',
    border: '1px solid #A6D3D3',
    cursor: 'pointer',
  },
  buttonDanger: {
    backgroundColor: '#FF6B6B',
    color: 'white',
    padding: '6px 14px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
  },

  addContainer: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },

  input: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #CFECEC',
    flex: 1,
  },
};
