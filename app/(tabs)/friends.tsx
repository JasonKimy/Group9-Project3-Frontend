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

  if (loading) {
    return <div>Loading friends...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>My Friends</h1>
      
      Friends:
      {friends.length === 0 ? (
        <p>No friends</p>
      ) : (
        <ul>
          {friends.map((friend) => (
          <div key={friend.id}>
            {friend.username}
            <button onClick={() => removeFriend(friend.friend_2_id)}>
              Remove
            </button>
            <button onClick={() => block(friend.friend_1_id)}>
              Block
            </button>
          </div>
          ))}
        </ul>
      )}
      Pending Requests:
      {pending.length === 0 ? (
        <p>No pending requests</p>
      ) : (
        <ul>
          {pending.map((pending) => (
          <div key={pending.id}>
            {pending.username}
            <button onClick={() => removeFriend(pending.friend_2_id)}>
              Cancel
            </button>
          </div>
          ))}
        </ul>
      )}
      Incoming Requests:
      {incoming.length === 0 ? (
        <p>No incoming requests</p>
      ) : (
        <ul>
          {incoming.map((request) => (
          <div key={request.id}>
            {request.username}
            <button onClick={() => acceptFriendRequest(request.id)}>
              Accept
            </button>
            <button onClick={() => rejectFriendRequest(request.id)}>
              Reject
            </button>
            <button onClick={() => block(request.friend_1_id)}>
              Block
            </button>
          </div>
          ))}
        </ul>
      )}
      Blocked Users:
      {blocked.length === 0 ? (
        <p>No blocked users</p>
      ) : (
        <ul>
          {blocked.map((blocked) => (
          <div key={blocked.id}>
            {blocked.username}
            <button onClick={() => unblock(blocked.friend_2_id)}>
              Unblock
            </button>
          </div>
          ))}
        </ul>
      )}
      <h2>Add a friend</h2>
      <input type="text" id="friendUsername" placeholder="Enter friend's username" />
      <button 
        onClick={() => {
            const input = document.getElementById('friendUsername') as HTMLInputElement;
            sendFriendRequest(input.value);
            input.value = '';
        }} 
      >
        Send Friend Request
      </button>
    </div>
  );
}