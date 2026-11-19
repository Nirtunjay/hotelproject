import React from 'react';

export default function Select({ label, error, options = [], className = '', id, ...props }) {
  const selectId = id || props.name;
  return (
    <div className="w-full space-y-1 text-left">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-text-main">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`input-field appearance-none bg-white ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
