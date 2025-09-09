import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/layout/Navigation';
import { ListingType, PropertyType, ListingPermission } from '../types';
import type { ListingType as ListingTypeType, PropertyType as PropertyTypeType, ListingPermission as ListingPermissionType } from '../types';
import api from '../utils/api';
import { Upload, X, Lock, Link, Globe } from 'lucide-react';

export default function CreateListing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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
    bedrooms: string;
    bathrooms: string;
    squareFeet: string;
    amenities: string;
    availableDate: string;
    furnished: boolean;
    privateBathroom: boolean;
    totalBedrooms: string;
    totalBathrooms: string;
    sharedBathrooms: string;
    roommateGender: string;
    ageMin: string;
    ageMax: string;
    permission: ListingPermissionType;
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
    bedrooms: '1',
    bathrooms: '1',
    squareFeet: '',
    amenities: '',
    availableDate: '',
    furnished: false,
    privateBathroom: false,
    totalBedrooms: '',
    totalBathrooms: '',
    sharedBathrooms: '',
    roommateGender: 'any',
    ageMin: '',
    ageMax: '',
    permission: ListingPermission.PRIVATE,
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 5 images total
    const newImages = [...images, ...files].slice(0, 5);
    setImages(newImages);

    // Create preview URLs
    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    // Clean up old preview URLs
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setImagePreviews(newPreviews);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Clean up the removed preview URL
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convert images to base64
      const imageBase64Array = await Promise.all(
        images.map(image => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(image);
          });
        })
      );

      const listingData = {
        title: formData.title,
        description: formData.description,
        listingType: formData.listingType,
        propertyType: formData.propertyType,
        price: Number(formData.price),
        bedrooms: formData.listingType === ListingType.APARTMENT ? Number(formData.bedrooms) : undefined,
        bathrooms: formData.listingType === ListingType.APARTMENT ? Number(formData.bathrooms) : undefined,
        squareFeet: formData.squareFeet ? Number(formData.squareFeet) : undefined,
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state.toUpperCase(),
          zipCode: formData.zipCode,
        },
        amenities: formData.amenities.split(',').map(a => a.trim()).filter(a => a),
        images: imageBase64Array,
        availableDate: formData.availableDate,
        permission: formData.permission,
        roomDetails: formData.listingType === ListingType.ROOM ? {
          furnished: formData.furnished,
          privateBathroom: formData.privateBathroom,
          totalBedrooms: formData.totalBedrooms ? Number(formData.totalBedrooms) : undefined,
          totalBathrooms: formData.totalBathrooms ? Number(formData.totalBathrooms) : undefined,
          sharedBathrooms: formData.sharedBathrooms ? Number(formData.sharedBathrooms) : undefined,
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

            {/* Apartment/Whole Property Details */}
            {formData.listingType === ListingType.APARTMENT && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Property Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bedrooms *
                    </label>
                    <select
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="0">Studio</option>
                      <option value="1">1 Bedroom</option>
                      <option value="2">2 Bedrooms</option>
                      <option value="3">3 Bedrooms</option>
                      <option value="4">4 Bedrooms</option>
                      <option value="5">5+ Bedrooms</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bathrooms *
                    </label>
                    <select
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="1">1 Bathroom</option>
                      <option value="1.5">1.5 Bathrooms</option>
                      <option value="2">2 Bathrooms</option>
                      <option value="2.5">2.5 Bathrooms</option>
                      <option value="3">3 Bathrooms</option>
                      <option value="3.5">3.5 Bathrooms</option>
                      <option value="4">4+ Bathrooms</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Square Feet
                    </label>
                    <input
                      type="number"
                      name="squareFeet"
                      value={formData.squareFeet}
                      onChange={handleChange}
                      placeholder="800"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Visibility *
              </label>
              <div className="space-y-3">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="permission"
                    value={ListingPermission.PRIVATE}
                    checked={formData.permission === ListingPermission.PRIVATE}
                    onChange={handleChange}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <Lock size={18} className="text-red-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Private</div>
                    <div className="text-sm text-gray-600">Only you and friends in your network can see this listing</div>
                  </div>
                </label>

                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="permission"
                    value={ListingPermission.LINK_ONLY}
                    checked={formData.permission === ListingPermission.LINK_ONLY}
                    onChange={handleChange}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <Link size={18} className="text-blue-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Link Only</div>
                    <div className="text-sm text-gray-600">Anyone with the share link can view, but it won't appear in public listings</div>
                  </div>
                </label>

                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="permission"
                    value={ListingPermission.PUBLIC}
                    checked={formData.permission === ListingPermission.PUBLIC}
                    onChange={handleChange}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <Globe size={18} className="text-green-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Public</div>
                    <div className="text-sm text-gray-600">Everyone can see this listing in the public section</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos (up to 5)
              </label>
              <div className="space-y-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    id="image-upload"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload size={32} className="text-gray-400" />
                    <div>
                      <span className="text-blue-600 font-medium">Upload photos</span>
                      <span className="text-gray-600"> or drag and drop</span>
                    </div>
                    <p className="text-sm text-gray-500">PNG, JPG up to 10MB each</p>
                  </label>
                </div>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {images.length >= 5 && (
                  <p className="text-sm text-orange-600">
                    Maximum of 5 images allowed. Remove some to add more.
                  </p>
                )}
              </div>
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

                {/* Apartment Sharing Details */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-800 border-b pb-2">Apartment Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Bedrooms in Apartment
                      </label>
                      <select
                        name="totalBedrooms"
                        value={formData.totalBedrooms}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select</option>
                        <option value="1">1 Bedroom</option>
                        <option value="2">2 Bedrooms</option>
                        <option value="3">3 Bedrooms</option>
                        <option value="4">4 Bedrooms</option>
                        <option value="5">5+ Bedrooms</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Bathrooms in Apartment
                      </label>
                      <select
                        name="totalBathrooms"
                        value={formData.totalBathrooms}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select</option>
                        <option value="1">1 Bathroom</option>
                        <option value="1.5">1.5 Bathrooms</option>
                        <option value="2">2 Bathrooms</option>
                        <option value="2.5">2.5 Bathrooms</option>
                        <option value="3">3 Bathrooms</option>
                        <option value="4">4+ Bathrooms</option>
                      </select>
                    </div>
                    
                    {!formData.privateBathroom && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Shared Bathrooms
                        </label>
                        <select
                          name="sharedBathrooms"
                          value={formData.sharedBathrooms}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select</option>
                          <option value="1">1 Shared Bathroom</option>
                          <option value="2">2 Shared Bathrooms</option>
                          <option value="3">3 Shared Bathrooms</option>
                        </select>
                      </div>
                    )}
                  </div>
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