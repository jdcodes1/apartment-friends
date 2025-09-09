import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navigation from "../components/layout/Navigation";
import { type Listing, ListingType } from "../types";
import api from "../utils/api";
import {
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Home,
  UserCheck,
  Plus,
  X,
} from "lucide-react";

export default function Dashboard() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    city: "",
    state: "",
    minPrice: "",
    maxPrice: "",
  });

  useEffect(() => {
    fetchListings();
  }, [filters]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.type) params.append("type", filters.type);
      if (filters.city) params.append("city", filters.city);
      if (filters.state) params.append("state", filters.state);
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);

      const response = await api.get(`/api/listings?${params.toString()}`);
      setListings(response.data.listings);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const getListingTypeIcon = (type: ListingType) => {
    switch (type) {
      case ListingType.APARTMENT:
        return <Home size={20} className="text-blue-600" />;
      case ListingType.ROOM:
        return <Users size={20} className="text-green-600" />;
      case ListingType.LOOKING_FOR:
        return <UserCheck size={20} className="text-purple-600" />;
      default:
        return <Home size={20} className="text-gray-600" />;
    }
  };

  const getListingTypeLabel = (type: ListingType) => {
    switch (type) {
      case ListingType.APARTMENT:
        return "Apartment for Rent";
      case ListingType.ROOM:
        return "Room for Rent";
      case ListingType.LOOKING_FOR:
        return "Looking for Place";
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Find Your Next Home
            </h1>
            <p className="text-xl text-gray-600">
              Browse apartments and rooms from your friend network
            </p>
          </div>

          <Link
            to="/create-listing"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            <Plus size={18} className="mr-2" />
            Create Listing
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <DollarSign size={18} className="text-white" />
            </div>
            Filter Listings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Type
              </label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
              >
                <option value="">All Types</option>
                <option value={ListingType.APARTMENT}>Apartments</option>
                <option value={ListingType.ROOM}>Rooms</option>
                <option value={ListingType.LOOKING_FOR}>Looking For</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                placeholder="Enter city"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                name="state"
                value={filters.state}
                onChange={handleFilterChange}
                placeholder="CA, NY, etc."
                maxLength={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Min Price
              </label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="$0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Max Price
              </label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="$5000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 font-medium">Loading listings...</p>
            </div>
          </div>
        ) : error ? (
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
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users size={48} className="text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              No listings found
            </h3>
            <p className="text-gray-600 mb-6 text-lg max-w-md mx-auto">
              No listings found in your friend network.
            </p>
            <Link
              to="/friends"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <Users size={18} className="mr-2" />
              Connect with friends
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {listings.map((listing) => (
              <Link
                key={listing._id}
                to={`/listing/${listing._id}`}
                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300 transform hover:scale-105"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                        {getListingTypeIcon(listing.listingType)}
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {getListingTypeLabel(listing.listingType)}
                      </span>
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                      ${listing.price}/mo
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {listing.title}
                  </h3>

                  <div className="flex items-center text-gray-600 text-sm mb-2">
                    <MapPin size={16} className="mr-2 text-blue-500" />
                    <span className="font-medium">{listing.location.city}, {listing.location.state}</span>
                  </div>

                  <div className="flex items-center text-gray-600 text-sm mb-4">
                    <Calendar size={16} className="mr-2 text-purple-500" />
                    <span>Available {formatDate(listing.availableDate)}</span>
                  </div>

                  <p className="text-gray-700 text-sm line-clamp-3 mb-4">
                    {listing.description}
                  </p>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {listing.owner.firstName.charAt(0)}{listing.owner.lastName.charAt(0)}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Listed by </span>
                        <span className="font-semibold text-gray-700">
                          {listing.owner.firstName} {listing.owner.lastName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
