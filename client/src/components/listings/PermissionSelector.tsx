import { useState } from 'react';
import { ListingPermission, type Listing } from '../../types';
import { Lock, Link, Globe, Check, X } from 'lucide-react';

interface PermissionSelectorProps {
  listing: Listing;
  onUpdate: (permission: ListingPermission) => Promise<void>;
}

export default function PermissionSelector({ listing, onUpdate }: PermissionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string>('');

  const handlePermissionChange = async (permission: ListingPermission) => {
    try {
      setUpdating(true);
      setError('');
      await onUpdate(permission);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update permission');
    } finally {
      setUpdating(false);
    }
  };

  const getPermissionIcon = (permission: ListingPermission) => {
    switch (permission) {
      case ListingPermission.PRIVATE:
        return <Lock size={16} className="text-red-600" />;
      case ListingPermission.LINK_ONLY:
        return <Link size={16} className="text-blue-600" />;
      case ListingPermission.PUBLIC:
        return <Globe size={16} className="text-green-600" />;
    }
  };

  const getPermissionLabel = (permission: ListingPermission) => {
    switch (permission) {
      case ListingPermission.PRIVATE:
        return 'Private';
      case ListingPermission.LINK_ONLY:
        return 'Link Only';
      case ListingPermission.PUBLIC:
        return 'Public';
    }
  };

  const getPermissionDescription = (permission: ListingPermission) => {
    switch (permission) {
      case ListingPermission.PRIVATE:
        return 'Only you and friends in your network can see this listing';
      case ListingPermission.LINK_ONLY:
        return 'Anyone with the share link can view, but it won\'t appear in public listings';
      case ListingPermission.PUBLIC:
        return 'Everyone can see this listing in the public section';
    }
  };

  const getPermissionColor = (permission: ListingPermission) => {
    switch (permission) {
      case ListingPermission.PRIVATE:
        return 'bg-red-50 text-red-700 border-red-200';
      case ListingPermission.LINK_ONLY:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case ListingPermission.PUBLIC:
        return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  return (
    <div className="relative">
      <div className="mb-2">
        <span className="text-sm font-medium text-gray-700">Visibility</span>
      </div>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={updating}
        className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium ${getPermissionColor(listing.permission)} hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {getPermissionIcon(listing.permission)}
        <span className="ml-2">{getPermissionLabel(listing.permission)}</span>
        <svg
          className={`ml-2 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-screen max-w-xs sm:w-80 left-0 sm:left-auto right-0 sm:right-auto bg-white border border-gray-200 rounded-lg shadow-lg z-10 -ml-4 sm:ml-0">
          <div className="p-4 space-y-3">
            {Object.values(ListingPermission).map((permission) => (
              <button
                key={permission}
                onClick={() => handlePermissionChange(permission)}
                disabled={updating || permission === listing.permission}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  permission === listing.permission
                    ? `${getPermissionColor(permission)} border-opacity-100`
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-start">
                  <div className="flex items-center mr-3 mt-0.5">
                    {getPermissionIcon(permission)}
                    {permission === listing.permission && (
                      <Check size={14} className="ml-1 text-current" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium mb-1">
                      {getPermissionLabel(permission)}
                    </div>
                    <div className="text-sm opacity-80">
                      {getPermissionDescription(permission)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {error && (
            <div className="p-4 border-t border-gray-200 bg-red-50">
              <div className="flex items-center text-red-700 text-sm">
                <X size={16} className="mr-2" />
                {error}
              </div>
            </div>
          )}

          <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <button
              onClick={() => setIsOpen(false)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}