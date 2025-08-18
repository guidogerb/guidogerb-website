import React from 'react';

export type SearchInputProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className="search" style={{ position: 'sticky', top: 0, zIndex: 5, padding: '12px 0 8px' }}>
      <input
        type="search"
        placeholder={placeholder ?? 'Search tracks and folders...'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', padding: '12px 14px', borderRadius: 10 }}
      />
    </div>
  );
}

export default SearchInput;
