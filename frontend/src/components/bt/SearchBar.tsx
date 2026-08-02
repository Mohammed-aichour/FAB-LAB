import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Rechercher par N° BT, machine, technicien, panne..."
}) => {
  return (
    <div className="relative flex-1 min-w-[240px]">
      <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-xs bg-slate-50/80 dark:bg-zinc-800/80 outline-none focus:border-fab-blue focus:bg-white dark:focus:bg-zinc-900 transition-all font-medium text-zinc-900 dark:text-white"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
