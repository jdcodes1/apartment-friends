import { Link } from "react-router-dom";
import { Home, Users, Search, Shield, Star, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6 md:justify-start md:space-x-10">
            <div className="flex justify-start lg:w-0 lg:flex-1">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Home className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ApartmentFriends
                </span>
              </Link>
            </div>
            <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0 space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Get started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Find your perfect
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  apartment with friends
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-xl">
                Connect with trusted friends to discover amazing apartment listings, 
                share recommendations, and find your ideal home together.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-xl flex items-center justify-center"
                >
                  Start exploring
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/login"
                  className="bg-white text-gray-800 border-2 border-gray-300 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-lg flex items-center justify-center"
                >
                  Sign in
                </Link>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-2xl lg:max-w-md">
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 h-96 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                      <Users className="h-16 w-16 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Connect & Discover</h3>
                    <p className="text-gray-600">Find apartments through your trusted network</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-16">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to find your next home
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-600 lg:mx-auto">
              Discover apartments through your social network and make informed decisions with trusted recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white mx-auto mb-4 shadow-lg">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Friend Network</h3>
              <p className="text-gray-600">
                Connect with friends and build a trusted network of apartment hunters and residents.
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white mx-auto mb-4 shadow-lg">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Search</h3>
              <p className="text-gray-600">
                Discover apartments through your friends' listings and get insider information.
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white mx-auto mb-4 shadow-lg">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Trusted Reviews</h3>
              <p className="text-gray-600">
                Get honest reviews and recommendations from people you know and trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              What our users are saying
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="bg-white rounded-xl shadow-lg p-8 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Found my dream apartment through a friend's recommendation. The process was so much easier than traditional apartment hunting!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  JS
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Jessica Smith</p>
                  <p className="text-gray-600 text-sm">New York, NY</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "The social aspect makes apartment hunting actually fun. Getting recommendations from friends I trust is invaluable."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  MD
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Mike Davis</p>
                  <p className="text-gray-600 text-sm">San Francisco, CA</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Best apartment hunting experience ever! My friends helped me avoid bad landlords and find great places."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  AL
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Anna Lee</p>
                  <p className="text-gray-600 text-sm">Chicago, IL</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to find your perfect apartment?
          </h2>
          <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
            Join thousands of users who are finding better apartments through their friend networks.
          </p>
          <div className="mt-8">
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-xl inline-flex items-center"
            >
              Get started for free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ApartmentFriends
              </span>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              © 2024 ApartmentFriends. Find your perfect home with trusted friends.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}