import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "../components/layout/Navigation";
import { type Listing } from "../types";
import api from "../utils/api";
import {
  MapPin,
  Calendar,
  Mail,
  Phone,
  ArrowLeft,
} from "lucide-react";

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
                  <div className="text-sm text-gray-600">
                    {listing.propertyType}
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
      </div>
    </div>
  );
}
