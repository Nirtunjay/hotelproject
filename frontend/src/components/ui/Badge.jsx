import React from 'react';

const badgeVariants = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  gold: 'bg-[#C6A15B]/15 text-[#C6A15B] font-semibold',
  navy: 'bg-[#142B45] text-white',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeVariants[variant] || badgeVariants.default} ${className}`}>
      {children}
    </span>
  );
}
