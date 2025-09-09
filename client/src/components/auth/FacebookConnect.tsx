import { useState } from 'react';
import api from '../../utils/api';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

interface FacebookConnectProps {
  onSuccess?: (response: any) => void;
  onError?: (error: string) => void;
}

export default function FacebookConnect({ onSuccess, onError }: FacebookConnectProps) {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  const initFacebookSDK = () => {
    return new Promise<void>((resolve) => {
      if (window.FB) {
        resolve();
        return;
      }

      window.fbAsyncInit = () => {
        window.FB.init({
          appId: import.meta.env.VITE_FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
        resolve();
      };

      // Load Facebook SDK
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    });
  };

  const handleFacebookLogin = async () => {
    try {
      setLoading(true);
      
      await initFacebookSDK();
      
      window.FB.login((response: any) => {
        if (response.authResponse) {
          handleFacebookResponse(response.authResponse);
        } else {
          onError?.('Facebook login was cancelled');
          setLoading(false);
        }
      }, { scope: 'user_friends,email' });
      
    } catch (error) {
      onError?.('Failed to initialize Facebook login');
      setLoading(false);
    }
  };

  const handleFacebookResponse = async (authResponse: any) => {
    try {
      // Connect Facebook account to user
      const connectResponse = await api.post('/api/facebook/connect-account', {
        accessToken: authResponse.accessToken
      });

      setConnected(true);
      onSuccess?.(connectResponse.data);
      
    } catch (error: any) {
      onError?.(error.response?.data?.message || 'Failed to connect Facebook account');
    } finally {
      setLoading(false);
    }
  };

  const importFacebookFriends = async () => {
    try {
      setLoading(true);
      
      await initFacebookSDK();
      
      window.FB.getLoginStatus((response: any) => {
        if (response.status === 'connected') {
          importFriendsWithToken(response.authResponse.accessToken);
        } else {
          window.FB.login((loginResponse: any) => {
            if (loginResponse.authResponse) {
              importFriendsWithToken(loginResponse.authResponse.accessToken);
            } else {
              onError?.('Facebook login required to import friends');
              setLoading(false);
            }
          }, { scope: 'user_friends' });
        }
      });
      
    } catch (error) {
      onError?.('Failed to import Facebook friends');
      setLoading(false);
    }
  };

  const importFriendsWithToken = async (accessToken: string) => {
    try {
      const response = await api.post('/api/facebook/import-friends', {
        accessToken: accessToken
      });

      onSuccess?.(response.data);
      
    } catch (error: any) {
      onError?.(error.response?.data?.message || 'Failed to import Facebook friends');
    } finally {
      setLoading(false);
    }
  };

  const disconnectFacebook = async () => {
    try {
      setLoading(true);
      await api.delete('/api/facebook/disconnect-account');
      setConnected(false);
      onSuccess?.({ message: 'Facebook account disconnected' });
    } catch (error: any) {
      onError?.(error.response?.data?.message || 'Failed to disconnect Facebook account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Connect with Facebook</h3>
        <p className="text-sm text-blue-800 mb-4">
          Connect your Facebook account to automatically find and connect with friends who are also using ApartmentFriends.
        </p>
        
        {!connected ? (
          <button
            onClick={handleFacebookLogin}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connecting...' : 'Connect Facebook Account'}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-green-700 mb-2">
              ✓ Facebook account connected
            </div>
            <div className="flex space-x-2">
              <button
                onClick={importFacebookFriends}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Importing...' : 'Import Facebook Friends'}
              </button>
              
              <button
                onClick={disconnectFacebook}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">Privacy Note</h4>
        <p className="text-sm text-yellow-800">
          We only use your Facebook connection to find mutual friends who are also using ApartmentFriends. 
          We don't post to your timeline or access other personal information.
        </p>
      </div>
    </div>
  );
}