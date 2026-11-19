import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-primary text-white/80 border-t border-primary/20 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-primary font-bold">
                S
              </div>
              <span className="text-xl font-bold tracking-tight text-white">StayEase</span>
            </div>
            <p className="text-sm text-gray-300">
              Curated hotel stays and dining reservations across premier destinations in India.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-secondary mb-3">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/hotels" className="hover:text-white transition-colors">Hotels</Link></li>
              <li><Link to="/restaurants" className="hover:text-white transition-colors">Restaurants</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-secondary mb-3">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/dashboard" className="hover:text-white transition-colors">My Reservations</Link></li>
              <li><Link to="/dashboard/profile" className="hover:text-white transition-colors">Profile</Link></li>
            </ul>
          </div>

          {/* Policy */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-secondary mb-3">Policy</h4>
            <p className="text-xs text-gray-400">
              Payment is settled directly at the property upon check-in or dining.
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} StayEase Hospitality Platform. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
