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

      const response = await api.get(`/listings?${params.toString()}`);
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
        return <Home size={20} style={{ color: 'var(--color-primary)' }} />;
      case ListingType.ROOM:
        return <Users size={20} style={{ color: 'var(--color-secondary)' }} />;
      case ListingType.LOOKING_FOR:
        return <UserCheck size={20} style={{ color: 'var(--color-accent)' }} />;
      default:
        return <Home size={20} style={{ color: 'var(--color-text-tertiary)' }} />;
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
    <div className="min-h-screen bg-organic-blob">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-display mb-2" style={{ color: 'var(--color-primary)' }}>
              Find Your Next Home
            </h1>
            <p className="text-xl text-secondary">
              Browse apartments and rooms from your friend network
            </p>
          </div>

          <Link
            to="/create-listing"
            className="btn-primary px-6 py-3 font-semibold inline-flex items-center"
          >
            <Plus size={18} className="mr-2" />
            Create Listing
          </Link>
        </div>

        {/* Filters */}
        <div className="card-elevated mb-8">
          <h3 className="text-xl font-bold text-display mb-6 flex items-center" style={{ color: 'var(--color-text-primary)' }}>
            <div className="w-8 h-8 bg-accent flex items-center justify-center mr-3" style={{ borderRadius: 'var(--border-radius-md)' }}>
              <DollarSign size={18} className="text-white" />
            </div>
            Filter Listings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Type
              </label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="select-field"
              >
                <option value="">All Types</option>
                <option value={ListingType.APARTMENT}>Apartments</option>
                <option value={ListingType.ROOM}>Rooms</option>
                <option value={ListingType.LOOKING_FOR}>Looking For</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                City
              </label>
              <input
                type="text"
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                placeholder="Enter city"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                State
              </label>
              <input
                type="text"
                name="state"
                value={filters.state}
                onChange={handleFilterChange}
                placeholder="CA, NY, etc."
                maxLength={2}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Min Price
              </label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="$0"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Max Price
              </label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="$5000"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
              <p className="text-secondary font-medium">Loading listings...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 mb-6" style={{ background: 'rgba(212, 95, 95, 0.1)', borderLeft: '4px solid var(--color-error)', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5" style={{ color: 'var(--color-error)' }} />
              </div>
              <div className="ml-3">
                <p className="font-medium" style={{ color: 'var(--color-error)' }}>{error}</p>
              </div>
            </div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, rgba(225, 112, 82, 0.1) 0%, rgba(124, 157, 142, 0.1) 100%)', borderRadius: '50%' }}>
              <Users size={48} style={{ color: 'var(--color-secondary)' }} />
            </div>
            <h3 className="text-2xl font-bold text-display mb-4" style={{ color: 'var(--color-text-primary)' }}>
              No listings found
            </h3>
            <p className="text-secondary mb-6 text-lg max-w-md mx-auto">
              No listings found in your friend network.
            </p>
            <Link
              to="/friends"
              className="btn-primary px-6 py-3 font-semibold inline-flex items-center"
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
                to={`/listings/${listing._id}`}
                className="card hover-lift overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2" style={{ borderRadius: 'var(--border-radius-md)', background: 'rgba(225, 112, 82, 0.08)' }}>
                        {getListingTypeIcon(listing.listingType)}
                      </div>
                      <span className="text-sm font-semibold text-secondary">
                        {getListingTypeLabel(listing.listingType)}
                      </span>
                    </div>
                    <span className="text-xl font-bold" style={{ color: 'var(--color-success)' }}>
                      ${listing.price}/mo
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-display mb-3" style={{ color: 'var(--color-text-primary)' }}>
                    {listing.title}
                  </h3>

                  <div className="flex items-center text-secondary text-sm mb-2">
                    <MapPin size={16} className="mr-2" style={{ color: 'var(--color-primary)' }} />
                    <span className="font-medium">{listing.location.city}, {listing.location.state}</span>
                  </div>

                  <div className="flex items-center text-secondary text-sm mb-4">
                    <Calendar size={16} className="mr-2" style={{ color: 'var(--color-accent)' }} />
                    <span>Available {formatDate(listing.availableDate)}</span>
                  </div>

                  <p className="text-secondary text-sm line-clamp-3 mb-4">
                    {listing.description}
                  </p>

                  <div className="pt-4 divider">
                    <div className="flex items-center space-x-3 mt-4">
                      <div className="w-8 h-8 bg-secondary flex items-center justify-center text-white font-bold text-xs" style={{ borderRadius: '50%' }}>
                        {listing.owner.firstName.charAt(0)}{listing.owner.lastName.charAt(0)}
                      </div>
                      <div className="text-sm">
                        <span className="text-tertiary">Listed by </span>
                        <span className="font-semibold text-secondary">
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
