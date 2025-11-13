import { useState } from 'react';
import { Download, Link as LinkIcon, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

interface ZillowData {
  title?: string;
  description?: string;
  price?: number;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  property_type?: string;
  amenities?: string[];
  image_urls?: string[];
  room_details?: {
    bedrooms?: number;
    bathrooms?: number;
    square_feet?: number;
  };
  zillow_url?: string;
}

interface ZillowImportProps {
  onImport: (data: ZillowData) => void;
}

export default function ZillowImport({ onImport }: ZillowImportProps) {
  const [zillowUrl, setZillowUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleImport = async () => {
    if (!zillowUrl.trim()) {
      setError('Please enter a Zillow URL');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await api.post('/listings/parse-zillow', {
        zillowUrl: zillowUrl.trim()
      });

      if (response.data.data) {
        onImport(response.data.data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error('No data returned from Zillow');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to import Zillow listing';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleImport();
    }
  };

  return (
    <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-blue-600 rounded-lg">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">Import from Zillow</h3>
          <p className="text-sm text-gray-600">
            Paste a Zillow listing URL to automatically fill in property details
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <LinkIcon className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="url"
              value={zillowUrl}
              onChange={(e) => setZillowUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="https://www.zillow.com/homedetails/..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleImport}
          disabled={loading || !zillowUrl.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors whitespace-nowrap"
        >
          {loading ? 'Importing...' : 'Import'}
        </button>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Import Failed</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-800">
            ✓ Zillow listing imported successfully! Review and edit the details below.
          </p>
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          <strong>Note:</strong> Some details may not import perfectly. Please review all fields before submitting.
        </p>
      </div>
    </div>
  );
}
