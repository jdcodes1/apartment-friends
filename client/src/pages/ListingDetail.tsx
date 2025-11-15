import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "../components/layout/Navigation";
import PermissionSelector from "../components/listings/PermissionSelector";
import { type Listing, ListingPermission } from "../types";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";
import {
  MapPin,
  Calendar,
  Mail,
  Phone,
  ArrowLeft,
  Share2,
  Check,
  X,
  Edit,
  Trash2,
} from "lucide-react";

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchListing(id);
    }
  }, [id]);

  const fetchListing = async (listingId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/listings/${listingId}`);
      setListing(response.data.listing);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch listing");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleShare = async () => {
    if (!id) return;

    // Show dialog immediately
    setShowShareDialog(true);
    setShareLoading(true);

    try {
      const response = await api.post(`/listings/${id}/share`);
      setShareUrl(response.data.shareUrl);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate share link");
      setShowShareDialog(false); // Close dialog on error
    } finally {
      setShareLoading(false);
    }
  };

  const handleRevokeShare = async () => {
    if (!id) return;

    try {
      setRevokeLoading(true);
      await api.delete(`/listings/${id}/share`);
      setShareUrl("");
      setShowShareDialog(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to revoke share link");
    } finally {
      setRevokeLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard", err);
    }
  };

  const handlePermissionUpdate = async (permission: ListingPermission) => {
    if (!id) return;

    await api.patch(`/listings/${id}/permission`, {
      permission,
    });

    // Update the listing state with the new permission
    setListing(prev => prev ? { ...prev, permission } : null);
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setDeleteLoading(true);
    try {
      await api.delete(`/listings/${id}`);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete listing');
    } finally {
      setDeleteLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const isOwner = user && listing && user.id === listing.owner.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading listing...</div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || "Listing not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to listings
        </button>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {listing.title}
                </h1>
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin size={20} className="mr-2" />
                  <span>
                    {listing.location.address}, {listing.location.city},{" "}
                    {listing.location.state} {listing.location.zipCode}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Listed on {formatDate(listing.createdAt)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  ${listing.price.toLocaleString()}/month
                </div>
                {listing.propertyType && (
                  <div className="text-sm text-gray-600 mb-3">
                    {listing.propertyType}
                  </div>
                )}

                {isOwner && (
                  <div className="space-y-3">
                    <PermissionSelector 
                      listing={listing} 
                      onUpdate={handlePermissionUpdate} 
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/listings/${id}/edit`)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        <Edit size={16} className="mr-2" />
                        Edit Listing
                      </button>
                      <button
                        onClick={() => setShowDeleteDialog(true)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        <Trash2 size={16} className="mr-2" />
                        Delete
                      </button>
                    </div>
                    <button
                      onClick={handleShare}
                      disabled={shareLoading}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Share2 size={16} className="mr-2" />
                      {shareLoading ? "Generating..." : "Share Listing"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center text-gray-600 mb-6">
              <Calendar size={20} className="mr-2" />
              <span>Available from {formatDate(listing.availableDate)}</span>
            </div>

            <div className="prose max-w-none mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Description
              </h3>
              <p className="text-gray-700 whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {listing.amenities.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Amenities
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {listing.amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700"
                    >
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {listing.roomDetails && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Room Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 mr-2">
                      Furnished:
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        listing.roomDetails.furnished
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {listing.roomDetails.furnished ? "Yes" : "No"}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 mr-2">
                      Private Bathroom:
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        listing.roomDetails.privateBathroom
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {listing.roomDetails.privateBathroom ? "Yes" : "No"}
                    </span>
                  </div>
                </div>

                {listing.roomDetails.roommatePreferences && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Roommate Preferences
                    </h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      {listing.roomDetails.roommatePreferences.gender && (
                        <div>
                          <span className="font-medium">
                            Gender preference:
                          </span>{" "}
                          {listing.roomDetails.roommatePreferences.gender}
                        </div>
                      )}
                      {listing.roomDetails.roommatePreferences.ageRange && (
                        <div>
                          <span className="font-medium">Age range:</span>{" "}
                          {listing.roomDetails.roommatePreferences.ageRange.min}{" "}
                          -{" "}
                          {listing.roomDetails.roommatePreferences.ageRange.max}{" "}
                          years old
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Contact Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {listing.owner.firstName.charAt(0)}
                    {listing.owner.lastName.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-gray-900">
                      {listing.owner.firstName} {listing.owner.lastName}
                    </div>
                    <div className="text-sm text-gray-600">Property Owner</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <Mail size={16} className="mr-2" />
                    <a
                      href={`mailto:${listing.owner.email}`}
                      className="hover:text-blue-600"
                    >
                      {listing.owner.email}
                    </a>
                  </div>

                  {listing.owner.phone && (
                    <div className="flex items-center text-gray-700">
                      <Phone size={16} className="mr-2" />
                      <a
                        href={`tel:${listing.owner.phone}`}
                        className="hover:text-blue-600"
                      >
                        {listing.owner.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Share Dialog */}
        {showShareDialog && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Share Listing
                </h3>
                <button
                  onClick={() => setShowShareDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                Anyone with this link can view your listing, even if they're not
                logged in.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share Link
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 flex items-center"
                  >
                    {copySuccess ? <Check size={16} /> : "Copy"}
                  </button>
                </div>
                {copySuccess && (
                  <p className="text-green-600 text-sm mt-1">
                    Copied to clipboard!
                  </p>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleRevokeShare}
                  disabled={revokeLoading}
                  className="px-4 py-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  {revokeLoading ? "Revoking..." : "Revoke Link"}
                </button>
                <button
                  onClick={() => setShowShareDialog(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Delete Listing
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this listing? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
