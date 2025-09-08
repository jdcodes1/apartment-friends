import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { type Listing } from "../types";
import axios from "axios";
import {
  MapPin,
  Calendar,
  Mail,
  Phone,
  Home,
  Users,
  UserCheck,
  ExternalLink,
  Globe,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function SharedListing() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (shareToken) {
      fetchSharedListing(shareToken);
    }
  }, [shareToken]);

  const fetchSharedListing = async (token: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/listings/shared/${token}`);
      setListing(response.data.listing);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch shared listing");
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

  const getListingTypeIcon = (type: string) => {
    switch (type) {
      case 'apartment':
        return <Home size={24} className="text-blue-600" />;
      case 'room':
        return <Users size={24} className="text-green-600" />;
      case 'looking_for':
        return <UserCheck size={24} className="text-purple-600" />;
      default:
        return <Home size={24} className="text-gray-600" />;
    }
  };

  const getListingTypeLabel = (type: string) => {
    switch (type) {
      case 'apartment':
        return "Apartment for Rent";
      case 'room':
        return "Room for Rent";
      case 'looking_for':
        return "Looking for Place";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading shared listing...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Listing Not Available</h2>
          <p className="text-gray-600 mb-6">
            {error || "This shared listing is no longer available or the link has expired."}
          </p>
          <a
            href="http://localhost:5173"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            <ExternalLink size={18} className="mr-2" />
            Visit Our Platform
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ApartmentFriends
                </h1>
              </div>
              
              <div className="hidden md:flex items-center space-x-2">
                <div className="flex items-center space-x-2 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                  <Globe size={18} />
                  <span>Shared Listing</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <a
                href="http://localhost:5173"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-sm text-sm"
              >
                Visit Platform
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="p-8">
            {/* Listing Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                    {getListingTypeIcon(listing.listingType)}
                  </div>
                  <span className="text-lg font-semibold text-gray-700">
                    {getListingTypeLabel(listing.listingType)}
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {listing.title}
                </h1>
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin size={20} className="mr-3 text-blue-500" />
                  <span className="text-lg">
                    {listing.location.address}, {listing.location.city},{" "}
                    {listing.location.state} {listing.location.zipCode}
                  </span>
                </div>
                <div className="text-gray-500">
                  Listed on {formatDate(listing.createdAt)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
                  ${listing.price.toLocaleString()}/month
                </div>
                {listing.propertyType && (
                  <div className="text-lg text-gray-600 font-medium">
                    {listing.propertyType}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center text-gray-600 mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <Calendar size={20} className="mr-3 text-purple-500" />
              <span className="text-lg font-medium">Available from {formatDate(listing.availableDate)}</span>
            </div>

            {/* Description */}
            <div className="prose max-w-none mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Description
              </h3>
              <p className="text-gray-700 whitespace-pre-line text-lg leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Amenities */}
            {listing.amenities.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Amenities
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {listing.amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-200 px-4 py-2 rounded-lg text-gray-700 font-medium"
                    >
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Room Details */}
            {listing.roomDetails && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Room Details
                </h3>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-700 mr-3">
                        Furnished:
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          listing.roomDetails.furnished
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {listing.roomDetails.furnished ? "Yes" : "No"}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <span className="font-semibold text-gray-700 mr-3">
                        Private Bathroom:
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Roommate Preferences
                      </h4>
                      <div className="space-y-2 text-gray-700">
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
              </div>
            )}

            {/* Contact Information */}
            <div className="border-t pt-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Contact Information
              </h3>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {listing.owner.firstName.charAt(0)}
                    {listing.owner.lastName.charAt(0)}
                  </div>
                  <div className="ml-6">
                    <div className="text-xl font-bold text-gray-900">
                      {listing.owner.firstName} {listing.owner.lastName}
                    </div>
                    <div className="text-gray-600">Property Owner</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-gray-700">
                    <Mail size={20} className="mr-3 text-blue-500" />
                    <a
                      href={`mailto:${listing.owner.email}`}
                      className="hover:text-blue-600 font-medium text-lg"
                    >
                      {listing.owner.email}
                    </a>
                  </div>

                  {listing.owner.phone && (
                    <div className="flex items-center text-gray-700">
                      <Phone size={20} className="mr-3 text-purple-500" />
                      <a
                        href={`tel:${listing.owner.phone}`}
                        className="hover:text-purple-600 font-medium text-lg"
                      >
                        {listing.owner.phone}
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-gray-600 text-sm">
                    This listing was shared from our platform. 
                    <a href="http://localhost:5173" className="text-blue-600 hover:text-blue-800 ml-1">
                      Join us to browse more listings →
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}