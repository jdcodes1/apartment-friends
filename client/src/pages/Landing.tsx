import { Link } from "react-router-dom";
import { Home, Users, Search, Shield, Star, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-organic-blob relative">
      <div className="absolute inset-0 bg-pattern-dots"></div>
      <div className="relative">
      {/* Header */}
      <header className="relative overflow-hidden">
        <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
          <div className="flex justify-between items-center py-6 md:justify-start md:space-x-10">
            <div className="flex justify-start lg:w-0 lg:flex-1">
              <Link to="/" className="flex items-center space-x-2 transition-smooth hover:scale-105">
                <div className="w-10 h-10 bg-primary flex items-center justify-center" style={{ borderRadius: 'var(--border-radius-md)' }}>
                  <Home className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-display" style={{ color: 'var(--color-primary)' }}>
                  ApartmentFriends
                </span>
              </Link>
            </div>
            <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0 space-x-4">
              <Link
                to="/login"
                className="text-secondary font-medium transition-smooth hover:scale-105"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="btn-primary"
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
              <h1 className="text-4xl md:text-6xl font-bold text-display mb-6 animate-fade-in-up stagger-1" style={{ color: 'var(--color-text-primary)', opacity: 0 }}>
                Social Apartment
                <span className="block" style={{ color: 'var(--color-primary)' }}>
                  Hunting
                </span>
              </h1>
              <p className="text-xl text-secondary mb-8 leading-relaxed max-w-xl animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
                Find apartments through your trusted network of friends and their connections.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
                <Link
                  to="/register"
                  className="btn-primary px-8 py-4 text-lg font-semibold flex items-center justify-center"
                >
                  Start exploring
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/login"
                  className="btn-outline px-8 py-4 text-lg font-semibold flex items-center justify-center"
                >
                  Sign in
                </Link>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center animate-fade-in-up stagger-4" style={{ opacity: 0 }}>
              <div className="relative mx-auto w-full lg:max-w-md">
                <div className="card-elevated p-8 h-96 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(225, 112, 82, 0.08) 0%, rgba(124, 157, 142, 0.08) 100%)' }}>
                  <div className="text-center">
                    <div className="w-32 h-32 bg-secondary flex items-center justify-center mx-auto mb-6 animate-float" style={{ borderRadius: '50%', boxShadow: 'var(--shadow-xl)' }}>
                      <Users className="h-16 w-16 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-display mb-2" style={{ color: 'var(--color-text-primary)' }}>Connect & Discover</h3>
                    <p className="text-secondary">Find apartments through your trusted network</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-16">
            <h2 className="text-base font-semibold tracking-wide uppercase badge-primary" style={{ display: 'inline-block' }}>Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold text-display tracking-tight sm:text-4xl" style={{ color: 'var(--color-text-primary)' }}>
              Everything you need to find your next home
            </p>
            <p className="mt-4 max-w-2xl text-xl text-secondary lg:mx-auto">
              Discover apartments through your social network and make informed decisions with trusted recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
              <div className="flex items-center justify-center h-16 w-16 bg-primary text-white mx-auto mb-4 transition-smooth hover:scale-110" style={{ borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-md)' }}>
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-display mb-2" style={{ color: 'var(--color-text-primary)' }}>Friend Network</h3>
              <p className="text-secondary">
                Connect with friends and build a trusted network of apartment hunters and residents.
              </p>
            </div>

            <div className="text-center animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
              <div className="flex items-center justify-center h-16 w-16 bg-secondary text-white mx-auto mb-4 transition-smooth hover:scale-110" style={{ borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-md)' }}>
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-display mb-2" style={{ color: 'var(--color-text-primary)' }}>Smart Search</h3>
              <p className="text-secondary">
                Discover apartments through your friends' listings and get insider information.
              </p>
            </div>

            <div className="text-center animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
              <div className="flex items-center justify-center h-16 w-16 bg-accent text-white mx-auto mb-4 transition-smooth hover:scale-110" style={{ borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-md)' }}>
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-display mb-2" style={{ color: 'var(--color-text-primary)' }}>Trusted Reviews</h3>
              <p className="text-secondary">
                Get honest reviews and recommendations from people you know and trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-warm-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-display sm:text-4xl" style={{ color: 'var(--color-text-primary)' }}>
              What our users are saying
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="card hover-lift animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" style={{ color: 'var(--color-accent)' }} />
                ))}
              </div>
              <p className="text-secondary mb-4">
                "Found my dream apartment through a friend's recommendation. The process was so much easier than traditional apartment hunting!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary flex items-center justify-center text-white font-bold mr-4" style={{ borderRadius: '50%' }}>
                  JS
                </div>
                <div>
                  <p className="font-semibold text-primary">Jessica Smith</p>
                  <p className="text-secondary text-sm">New York, NY</p>
                </div>
              </div>
            </div>

            <div className="card hover-lift animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" style={{ color: 'var(--color-accent)' }} />
                ))}
              </div>
              <p className="text-secondary mb-4">
                "The social aspect makes apartment hunting actually fun. Getting recommendations from friends I trust is invaluable."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-secondary flex items-center justify-center text-white font-bold mr-4" style={{ borderRadius: '50%' }}>
                  MD
                </div>
                <div>
                  <p className="font-semibold text-primary">Mike Davis</p>
                  <p className="text-secondary text-sm">San Francisco, CA</p>
                </div>
              </div>
            </div>

            <div className="card hover-lift animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" style={{ color: 'var(--color-accent)' }} />
                ))}
              </div>
              <p className="text-secondary mb-4">
                "Best apartment hunting experience ever! My friends helped me avoid bad landlords and find great places."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-accent flex items-center justify-center text-white font-bold mr-4" style={{ borderRadius: '50%' }}>
                  AL
                </div>
                <div>
                  <p className="font-semibold text-primary">Anna Lee</p>
                  <p className="text-secondary text-sm">Chicago, IL</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern-grid opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-display text-white sm:text-4xl">
            Ready to find your perfect apartment?
          </h2>
          <p className="mt-4 text-xl max-w-2xl mx-auto" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Join thousands of users who are finding better apartments through their friend networks.
          </p>
          <div className="mt-8">
            <Link
              to="/register"
              className="bg-surface px-8 py-4 text-lg font-bold inline-flex items-center transition-smooth hover:scale-105"
              style={{ color: 'var(--color-primary)', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-xl)' }}
            >
              Get started for free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary flex items-center justify-center" style={{ borderRadius: 'var(--border-radius-md)' }}>
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-display" style={{ color: 'var(--color-primary)' }}>
                ApartmentFriends
              </span>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-secondary">
              © 2024 ApartmentFriends. Find your perfect home with trusted friends.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}