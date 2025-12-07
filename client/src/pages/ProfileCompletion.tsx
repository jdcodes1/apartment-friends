import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, MapPin, Home, ArrowRight } from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import type { ProfileCompletionData } from "../types";

export default function ProfileCompletion() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<ProfileCompletionData>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    currentAddress: "",
    currentCity: "",
    currentState: "",
    currentZip: "",
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        currentAddress: user.currentAddress || "",
        currentCity: user.currentCity || "",
        currentState: user.currentState || "",
        currentZip: user.currentZip || "",
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 2);
    setFormData({
      ...formData,
      currentState: value,
    });
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.currentAddress ||
      !formData.currentCity ||
      !formData.currentState ||
      !formData.currentZip
    ) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.put("/auth/complete-profile", formData);
      // Update localStorage with the new user data
      localStorage.setItem("user", JSON.stringify(response.data.user));
      await refreshUser(); // Refresh user data from server
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to complete profile");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-organic-blob relative flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-pattern-dots"></div>

      <div className="relative w-full max-w-2xl">
        <div className="card-elevated animate-scale-in">
          <div className="text-center mb-8">
            <h1
              className="text-3xl md:text-4xl font-bold text-display mb-3"
              style={{ color: "var(--color-primary)" }}
            >
              Complete Your Profile
            </h1>
            <p className="text-secondary text-lg">
              A few more details to get you set up.
            </p>
          </div>

          {error && (
            <div
              className="mb-6 p-4"
              style={{
                background: "rgba(212, 95, 95, 0.1)",
                borderLeft: "4px solid var(--color-error)",
                borderRadius: "var(--border-radius-md)",
              }}
            >
              <p
                className="font-medium"
                style={{ color: "var(--color-error)" }}
              >
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-primary">
                  <User size={16} className="inline mr-2" />
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="John"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-primary">
                  <User size={16} className="inline mr-2" />
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-primary">
                <Home size={16} className="inline mr-2" />
                Street Address
              </label>
              <input
                type="text"
                name="currentAddress"
                value={formData.currentAddress}
                onChange={handleChange}
                className="input-field"
                placeholder="123 Main St, Apt 4B"
                required
              />
              <p className="text-xs text-tertiary mt-1">
                This will be used as the default address for your listings.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2 text-primary">
                  <MapPin size={16} className="inline mr-2" />
                  City
                </label>
                <input
                  type="text"
                  name="currentCity"
                  value={formData.currentCity}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="San Francisco"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-primary">
                  State
                </label>
                <input
                  type="text"
                  name="currentState"
                  value={formData.currentState}
                  onChange={handleStateChange}
                  className="input-field"
                  placeholder="CA"
                  maxLength={2}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-primary">
                ZIP Code
              </label>
              <input
                type="text"
                name="currentZip"
                value={formData.currentZip}
                onChange={handleChange}
                className="input-field"
                placeholder="94102"
                maxLength={5}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-4 text-lg font-semibold flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  Complete Profile
                  <ArrowRight size={20} className="ml-2" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
