import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/layout/Navigation';
import { ListingType, PropertyType } from '../types';
import type { ListingType as ListingTypeType, PropertyType as PropertyTypeType } from '../types';
import api from '../utils/api';

export default function CreateListing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    listingType: ListingTypeType;
    propertyType: PropertyTypeType;
    price: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    amenities: string;
    availableDate: string;
    furnished: boolean;
    privateBathroom: boolean;
    roommateGender: string;
    ageMin: string;
    ageMax: string;
  }>({
    title: '',
    description: '',
    listingType: ListingType.APARTMENT,
    propertyType: PropertyType.ONE_BEDROOM,
    price: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    amenities: '',
    availableDate: '',
    furnished: false,
    privateBathroom: false,
    roommateGender: 'any',
    ageMin: '',
    ageMax: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const listingData = {
        title: formData.title,
        description: formData.description,
        listingType: formData.listingType,
        propertyType: formData.propertyType,
        price: Number(formData.price),
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state.toUpperCase(),
          zipCode: formData.zipCode,
        },
        amenities: formData.amenities.split(',').map(a => a.trim()).filter(a => a),
        availableDate: formData.availableDate,
        roomDetails: formData.listingType === ListingType.ROOM ? {
          furnished: formData.furnished,
          privateBathroom: formData.privateBathroom,
          roommatePreferences: {
            gender: formData.roommateGender === 'any' ? undefined : formData.roommateGender,
            ageRange: formData.ageMin && formData.ageMax ? {
              min: Number(formData.ageMin),
              max: Number(formData.ageMax),
            } : undefined,
          },
        } : undefined,
      };

      await api.post('/listings', listingData);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Listing</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Listing Type *
              </label>
              <select
                name="listingType"
                value={formData.listingType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={ListingType.APARTMENT}>Apartment for Rent</option>
                <option value={ListingType.ROOM}>Room for Rent</option>
                <option value={ListingType.LOOKING_FOR}>Looking for Place</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Beautiful 2BR apartment in downtown"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Describe your listing..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {(formData.listingType === ListingType.APARTMENT || formData.listingType === ListingType.ROOM) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type
                </label>
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={PropertyType.STUDIO}>Studio</option>
                  <option value={PropertyType.ONE_BEDROOM}>1 Bedroom</option>
                  <option value={PropertyType.TWO_BEDROOM}>2 Bedrooms</option>
                  <option value={PropertyType.THREE_BEDROOM}>3 Bedrooms</option>
                  <option value={PropertyType.FOUR_PLUS_BEDROOM}>4+ Bedrooms</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.listingType === ListingType.LOOKING_FOR ? 'Budget *' : 'Monthly Rent *'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  placeholder="2000"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="123 Main St"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  placeholder="San Francisco"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  maxLength={2}
                  placeholder="CA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  required
                  placeholder="94102"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Date *
              </label>
              <input
                type="date"
                name="availableDate"
                value={formData.availableDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amenities
              </label>
              <input
                type="text"
                name="amenities"
                value={formData.amenities}
                onChange={handleChange}
                placeholder="Gym, Pool, Parking (comma-separated)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Separate amenities with commas</p>
            </div>

            {formData.listingType === ListingType.ROOM && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Room Details</h3>
                
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="furnished"
                      checked={formData.furnished}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Furnished</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="privateBathroom"
                      checked={formData.privateBathroom}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Private Bathroom</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Roommate Gender
                  </label>
                  <select
                    name="roommateGender"
                    value={formData.roommateGender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="any">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Age
                    </label>
                    <input
                      type="number"
                      name="ageMin"
                      value={formData.ageMin}
                      onChange={handleChange}
                      min="18"
                      max="99"
                      placeholder="18"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Age
                    </label>
                    <input
                      type="number"
                      name="ageMax"
                      value={formData.ageMax}
                      onChange={handleChange}
                      min="18"
                      max="99"
                      placeholder="65"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}