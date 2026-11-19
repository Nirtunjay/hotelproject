import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, User, LogOut, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <header className="bg-surface border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-secondary font-bold text-xl">
            S
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-primary">StayEase</span>
            <span className="block text-[10px] uppercase tracking-widest text-secondary font-semibold">Hospitality</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/hotels" className="text-text-main hover:text-primary transition-colors">
            Hotels
          </Link>
          <Link to="/restaurants" className="text-text-main hover:text-primary transition-colors">
            Restaurants
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-text-main hover:text-primary transition-colors"
              >
                <User size={16} />
                <span>My Bookings</span>
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                >
                  <Shield size={15} />
                  <span>Admin</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-muted hover:text-red-600 transition-colors p-1"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="px-4 py-2 text-primary font-medium hover:text-primary-light">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary py-2 px-4 text-sm">
                Register
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-text-main hover:text-primary"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-surface px-4 py-6 space-y-4 shadow-lg animate-in fade-in slide-in-from-top-2">
          <Link
            to="/hotels"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-base font-medium text-text-main"
          >
            Hotels
          </Link>
          <Link
            to="/restaurants"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-base font-medium text-text-main"
          >
            Restaurants
          </Link>
          <hr className="border-gray-100" />
          {user ? (
            <div className="space-y-3">
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-base font-medium text-text-main"
              >
                My Bookings & Profile
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-base font-medium text-primary font-semibold"
                >
                  Admin Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left py-2 text-base font-medium text-red-600"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block text-center w-full py-2.5 rounded-lg border border-primary text-primary font-medium"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="block text-center w-full py-2.5 rounded-lg bg-primary text-white font-medium"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
