import React from 'react';
import { NavLink } from 'react-router-dom';
import { BedDouble, Utensils, User, Lock, LayoutDashboard } from 'lucide-react';

export default function DashboardSidebar() {
  const links = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/dashboard/bookings', label: 'Hotel Bookings', icon: BedDouble },
    { to: '/dashboard/reservations', label: 'Restaurant Tables', icon: Utensils },
    { to: '/dashboard/profile', label: 'My Profile', icon: User },
  ];

  return (
    <aside className="w-full md:w-64 bg-surface rounded-xl p-4 border border-gray-100 shadow-xs h-fit space-y-1">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
        User Portal
      </div>
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-text-main hover:bg-gray-50'
              }`
            }
          >
            <Icon size={18} />
            <span>{link.label}</span>
          </NavLink>
        );
      })}
    </aside>
  );
}
