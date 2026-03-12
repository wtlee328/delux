import React from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  destinations: string[];
  categories: FilterOption[];
  statuses: string[];
  filters: {
    destination: string;
    category: string;
    status: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
  showCategory?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  destinations,
  categories,
  statuses,
  filters,
  onFilterChange,
  onClear,
  showCategory = true
}) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-end">
      <div className="flex flex-col gap-1 min-w-[180px]">
        <label className="text-xs font-bold text-slate-500 uppercase">目的地</label>
        <select
          value={filters.destination}
          onChange={(e) => onFilterChange('destination', e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"
        >
          <option value="">全部目的地</option>
          {destinations.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {showCategory && (
        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-xs font-bold text-slate-500 uppercase">類別</label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"
          >
            <option value="">全部類別</option>
            {categories.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1 min-w-[150px]">
        <label className="text-xs font-bold text-slate-500 uppercase">狀態</label>
        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"
        >
          <option value="">全部狀態</option>
          {statuses.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {(filters.destination || filters.category || filters.status) && (
        <button
          onClick={onClear}
          className="px-4 py-2 text-sm text-red-500 hover:text-red-700 font-medium h-9 border border-transparent hover:border-red-100 rounded-lg transition-all"
        >
          清除篩選
        </button>
      )}
    </div>
  );
};

export default FilterBar;
