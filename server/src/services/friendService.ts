import { supabase } from '../config/supabase';
import { FriendConnection, FriendConnectionInsert, FriendConnectionUpdate, Profile } from '../types/database';

export class FriendService {
  async sendFriendRequest(requesterId: string, targetId: string): Promise<FriendConnection | null> {
    // Ensure user1 < user2 alphabetically for consistent ordering
    const [user1, user2] = [requesterId, targetId].sort();
    
    const friendConnectionData: FriendConnectionInsert = {
      user1,
      user2,
      status: 'pending',
      requested_by: requesterId
    };

    const { data, error } = await supabase
      .from('friend_connections')
      .insert(friendConnectionData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async acceptFriendRequest(connectionId: string): Promise<FriendConnection | null> {
    const { data, error } = await supabase
      .from('friend_connections')
      .update({ status: 'accepted' })
      .eq('id', connectionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async rejectFriendRequest(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from('friend_connections')
      .delete()
      .eq('id', connectionId);

    if (error) throw error;
  }

  async blockUser(blockerId: string, targetId: string): Promise<FriendConnection | null> {
    const [user1, user2] = [blockerId, targetId].sort();
    
    const { data, error } = await supabase
      .from('friend_connections')
      .upsert({
        user1,
        user2,
        status: 'blocked',
        requested_by: blockerId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    const [user1, user2] = [userId, friendId].sort();
    
    const { error } = await supabase
      .from('friend_connections')
      .delete()
      .eq('user1', user1)
      .eq('user2', user2);

    if (error) throw error;
  }

  async getFriendRequests(userId: string): Promise<FriendConnection[]> {
    const { data, error } = await supabase
      .from('friend_connections')
      .select('*')
      .or(`user1.eq.${userId},user2.eq.${userId}`)
      .eq('status', 'pending')
      .neq('requested_by', userId);

    if (error) throw error;
    return data || [];
  }

  async getFriends(userId: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('friend_connections')
      .select(`
        *,
        profile1:profiles!friend_connections_user1_fkey(*),
        profile2:profiles!friend_connections_user2_fkey(*)
      `)
      .or(`user1.eq.${userId},user2.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) throw error;

    // Extract the friend profiles (not the current user)
    const friends: Profile[] = [];
    data?.forEach(connection => {
      if (connection.user1 === userId && connection.profile2) {
        friends.push(connection.profile2);
      } else if (connection.user2 === userId && connection.profile1) {
        friends.push(connection.profile1);
      }
    });

    return friends;
  }

  async getFriendConnection(user1Id: string, user2Id: string): Promise<FriendConnection | null> {
    const [userId1, userId2] = [user1Id, user2Id].sort();
    
    const { data, error } = await supabase
      .from('friend_connections')
      .select('*')
      .eq('user1', userId1)
      .eq('user2', userId2)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getFriendNetworkUpToDegree(userId: string, maxDegree: number = 3): Promise<Profile[]> {
    // This is a complex query that would be better handled by a stored procedure
    // For now, we'll implement a simplified version using recursive logic
    const visited = new Set<string>();
    const friends: Profile[] = [];
    
    const findFriendsRecursive = async (currentUserId: string, degree: number): Promise<void> => {
      if (degree > maxDegree || visited.has(currentUserId)) return;
      visited.add(currentUserId);

      const directFriends = await this.getFriends(currentUserId);
      
      for (const friend of directFriends) {
        if (!visited.has(friend.id)) {
          friends.push(friend);
          if (degree < maxDegree) {
            await findFriendsRecursive(friend.id, degree + 1);
          }
        }
      }
    };

    await findFriendsRecursive(userId, 1);
    
    // Remove duplicates based on ID
    const uniqueFriends = friends.filter((friend, index, self) => 
      index === self.findIndex(f => f.id === friend.id)
    );

    return uniqueFriends;
  }

  async areFriendsWithinDegrees(userId1: string, userId2: string, maxDegree: number = 3): Promise<boolean> {
    const network = await this.getFriendNetworkUpToDegree(userId1, maxDegree);
    return network.some(friend => friend.id === userId2);
  }
}