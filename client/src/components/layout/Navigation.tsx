import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Home, Plus, Users, User, LogOut, Menu, X } from "lucide-react";

export default function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <nav
        className="glass sticky top-0 z-50"
        style={{
          boxShadow: "var(--shadow-md)",
          borderBottom: "1px solid rgba(225, 112, 82, 0.1)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to={user ? "/dashboard" : "/"}
                className="shrink-0 flex items-center space-x-2 transition-smooth hover:scale-105"
              >
                <div
                  className="w-10 h-10 bg-primary flex items-center justify-center"
                  style={{ borderRadius: "var(--border-radius-md)" }}
                >
                  <Home className="h-5 w-5 text-white" />
                </div>
                <h1
                  className="text-lg sm:text-xl font-bold text-display"
                  style={{ color: "var(--color-primary)" }}
                >
                  ApartmentFriends
                </h1>
              </Link>

              {/* Desktop Navigation */}
              {user && (
                <div className="hidden md:flex items-center space-x-2">
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-2 text-secondary px-4 py-2 text-sm font-medium transition-smooth hover:scale-105"
                    style={{ borderRadius: "var(--border-radius-md)" }}
                  >
                    <Home size={18} />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    to="/create-listing"
                    className="flex items-center space-x-2 text-secondary px-4 py-2 text-sm font-medium transition-smooth hover:scale-105"
                    style={{ borderRadius: "var(--border-radius-md)" }}
                  >
                    <Plus size={18} />
                    <span>Create Listing</span>
                  </Link>

                  <Link
                    to="/friends"
                    className="flex items-center space-x-2 text-secondary px-4 py-2 text-sm font-medium transition-smooth hover:scale-105"
                    style={{ borderRadius: "var(--border-radius-md)" }}
                  >
                    <Users size={18} />
                    <span>Friends</span>
                  </Link>

                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-secondary transition-smooth hover:scale-105"
                style={{ borderRadius: "var(--border-radius-md)" }}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              {/* Desktop user info and actions */}
              {user && (
                <>
                  <div className="hidden sm:flex items-center space-x-3">
                    <div
                      className="w-8 h-8 bg-secondary flex items-center justify-center text-white font-bold text-sm"
                      style={{ borderRadius: "50%" }}
                    >
                      {user?.firstName?.charAt(0)}
                      {user?.lastName?.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-secondary">
                      Welcome, {user?.firstName}
                    </span>
                  </div>

                  <div className="hidden md:flex items-center space-x-2">
                    <Link
                      to="/profile"
                      className="flex items-center space-x-1 text-secondary p-2 transition-smooth hover:scale-105"
                      style={{ borderRadius: "var(--border-radius-md)" }}
                    >
                      <User size={18} />
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-1 p-2 transition-smooth hover:scale-105"
                      style={{
                        color: "var(--color-error)",
                        borderRadius: "var(--border-radius-md)",
                      }}
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
                    className="text-secondary px-4 py-2 text-sm font-medium transition-smooth hover:scale-105"
                  >
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden glass"
            style={{ borderTop: "1px solid rgba(225, 112, 82, 0.1)" }}
          >
            <div className="px-4 py-3 space-y-2">
              {user ? (
                <>
                  {/* User info on mobile */}
                  <div
                    className="flex items-center space-x-3 py-2"
                    style={{
                      borderBottom: "1px solid rgba(225, 112, 82, 0.1)",
                    }}
                  >
                    <div
                      className="w-8 h-8 bg-secondary flex items-center justify-center text-white font-bold text-sm"
                      style={{ borderRadius: "50%" }}
                    >
                      {user?.firstName?.charAt(0)}
                      {user?.lastName?.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-secondary">
                      {user?.firstName} {user?.lastName}
                    </span>
                  </div>

                  {/* Mobile navigation links */}
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-secondary transition-smooth"
                    style={{ borderRadius: "var(--border-radius-md)" }}
                  >
                    <Home size={20} />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    to="/create-listing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-secondary transition-smooth"
                    style={{ borderRadius: "var(--border-radius-md)" }}
                  >
                    <Plus size={20} />
                    <span>Create Listing</span>
                  </Link>

                  <Link
                    to="/friends"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-secondary transition-smooth"
                    style={{ borderRadius: "var(--border-radius-md)" }}
                  >
                    <Users size={20} />
                    <span>Friends</span>
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-secondary transition-smooth"
                    style={{ borderRadius: "var(--border-radius-md)" }}
                  >
                    <User size={20} />
                    <span>Profile</span>
                  </Link>

                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 px-4 py-3 transition-smooth w-full text-left"
                    style={{
                      color: "var(--color-error)",
                      borderRadius: "var(--border-radius-md)",
                    }}
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-secondary transition-smooth"
                    style={{ borderRadius: "var(--border-radius-md)" }}
                  >
                    <User size={20} />
                    <span>Sign In</span>
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 bg-primary text-white font-medium transition-smooth"
                    style={{ borderRadius: "var(--border-radius-md)" }}
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
