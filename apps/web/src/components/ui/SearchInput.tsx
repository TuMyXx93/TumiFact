import type { InputHTMLAttributes } from 'react';

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function SearchInput({ label = 'Buscar', className = '', ...props }: SearchInputProps) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        type="search"
        placeholder="Buscar producto..."
        className={`w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none ${className}`}
        {...props}
      />
    </label>
  );
}
