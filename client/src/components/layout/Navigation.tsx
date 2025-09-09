import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Home, Plus, Users, User, LogOut, Globe, Menu, X } from 'lucide-react';

export default function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to={user ? "/dashboard" : "/"} className="flex-shrink-0 flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ApartmentFriends
                </h1>
              </Link>
              
              {/* Desktop Navigation */}
              {user && (
                <div className="hidden md:flex items-center space-x-2">
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    <Home size={18} />
                    <span>Dashboard</span>
                  </Link>
                  
                  <Link
                    to="/create-listing"
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    <Plus size={18} />
                    <span>Create Listing</span>
                  </Link>
                  
                  <Link
                    to="/friends"
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    <Users size={18} />
                    <span>Friends</span>
                  </Link>
                  
                  <Link
                    to="/public"
                    className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    <Globe size={18} />
                    <span>Public Listings</span>
                  </Link>
                </div>
              )}

              {/* Always show Public link for unauthenticated users */}
              {!user && (
                <div className="hidden sm:flex items-center">
                  <Link
                    to="/public"
                    className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    <Globe size={18} />
                    <span>Public Listings</span>
                  </Link>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              {/* Desktop user info and actions */}
              {user && (
                <>
                  <div className="hidden sm:flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Welcome, {user?.firstName}
                    </span>
                  </div>
                  
                  <div className="hidden md:flex items-center space-x-2">
                    <Link
                      to="/profile"
                      className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200"
                    >
                      <User size={18} />
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-1 text-gray-700 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                </>
              )}

              {/* Login/Register for unauthenticated users */}
              {!user && (
                <div className="hidden sm:flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-blue-600 px-4 py-2 text-sm font-medium transition-all duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
            <div className="px-4 py-3 space-y-2">
              {user ? (
                <>
                  {/* User info on mobile */}
                  <div className="flex items-center space-x-3 py-2 border-b border-gray-200">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {user?.firstName} {user?.lastName}
                    </span>
                  </div>

                  {/* Mobile navigation links */}
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200"
                  >
                    <Home size={20} />
                    <span>Dashboard</span>
                  </Link>
                  
                  <Link
                    to="/create-listing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200"
                  >
                    <Plus size={20} />
                    <span>Create Listing</span>
                  </Link>
                  
                  <Link
                    to="/friends"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200"
                  >
                    <Users size={20} />
                    <span>Friends</span>
                  </Link>
                  
                  <Link
                    to="/public"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-all duration-200"
                  >
                    <Globe size={20} />
                    <span>Public Listings</span>
                  </Link>
                  
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200"
                  >
                    <User size={20} />
                    <span>Profile</span>
                  </Link>
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 w-full text-left"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/public"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-all duration-200"
                  >
                    <Globe size={20} />
                    <span>Public Listings</span>
                  </Link>
                  
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200"
                  >
                    <User size={20} />
                    <span>Sign In</span>
                  </Link>
                  
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium transition-all duration-200"
                  >
                    <Plus size={20} />
                    <span>Sign Up</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}