import { useState, useEffect } from "react";
import Navigation from "../components/layout/Navigation";
import { type User, type FriendConnection } from "../types";
import api from "../utils/api";
import { UserPlus, Check, X, Phone } from "lucide-react";

export default function Friends() {
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{
    incoming: FriendConnection[];
    outgoing: FriendConnection[];
  }>({
    incoming: [],
    outgoing: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await api.get("/friends/list");
      setFriends(response.data?.friends || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch friends");
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await api.get("/friends/requests");
      setPendingRequests({
        incoming: response.data?.incoming || [],
        outgoing: response.data?.outgoing || [],
      });
    } catch (err: any) {
      console.error("Failed to fetch pending requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (connectionId: string) => {
    try {
      await api.post(`/friends/accept-request/${connectionId}`);
      await fetchFriends();
      await fetchPendingRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to accept request");
    }
  };

  const removeFriend = async (friendId: string) => {
    if (window.confirm("Are you sure you want to remove this friend?")) {
      try {
        await api.delete(`/friends/remove/${friendId}`);
        await fetchFriends();
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to remove friend");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 font-medium">Loading friends...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Friends
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Connect with friends to see their listings and expand your housing
            network
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg mb-6 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <Check className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-green-700 font-medium">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Friend Requests */}
        {pendingRequests.incoming.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mr-3">
                <UserPlus size={18} className="text-white" />
              </div>
              Pending Friend Requests
            </h2>
            <div className="space-y-4">
              {pendingRequests.incoming.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                      {request.user1.firstName.charAt(0)}
                      {request.user1.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">
                        {request.user1.firstName} {request.user1.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {request.user1.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => acceptRequest(request._id)}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg text-sm font-medium"
                    >
                      <Check size={16} className="mr-2" />
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <UserPlus size={18} className="text-white" />
              </div>
              My Friends ({friends.length})
            </h2>
          </div>

          {friends.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserPlus size={48} className="text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                No friends yet
              </h3>
              <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                Connect with friends to see their apartment listings
              </p>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 max-w-md mx-auto">
                <h4 className="font-bold text-blue-900 mb-4 text-lg">
                  How to connect with friends:
                </h4>
                <ol className="text-blue-800 space-y-3 text-left">
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      1
                    </span>
                    Ask friends to create an account on ApartmentFriends
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      2
                    </span>
                    Share email addresses to send friend requests
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      3
                    </span>
                    Start browsing each other's listings!
                  </li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {friends.map((friend) => (
                <div
                  key={friend._id}
                  className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                      {friend.firstName.charAt(0)}
                      {friend.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg">
                        {friend.firstName} {friend.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {friend.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFriend(friend._id)}
                    className="w-full text-sm text-red-600 hover:text-red-700 hover:bg-red-50 py-3 px-4 rounded-lg border border-red-300 hover:border-red-400 transition-all duration-200 font-medium"
                  >
                    Remove Friend
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outgoing Requests */}
        {pendingRequests.outgoing.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mt-8 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                <UserPlus size={18} className="text-white" />
              </div>
              Sent Friend Requests
            </h2>
            <div className="space-y-4">
              {pendingRequests.outgoing.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-purple-50 border border-gray-200 rounded-xl"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                      {request.user2.firstName.charAt(0)}
                      {request.user2.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">
                        {request.user2.firstName} {request.user2.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {request.user2.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 font-medium">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
                    Pending...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
