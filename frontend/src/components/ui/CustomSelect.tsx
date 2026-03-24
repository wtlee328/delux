import React from 'react';

interface CustomSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: string;
  containerClassName?: string;
  label?: string;
  labelClassName?: string;
  error?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ 
  icon, 
  children, 
  className, 
  containerClassName = '', 
  label, 
  labelClassName = '',
  error,
  ...props 
}) => {
  return (
    <div className={`flex flex-col gap-1 ${containerClassName}`}>
      {label && (
        <label className={`text-sm font-medium text-slate-700 ${labelClassName}`}>
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-0 h-full flex items-center pointer-events-none text-slate-400 group-hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
          </div>
        )}
        <select 
          {...props}
          className={`
            w-full ${icon ? 'pl-10' : 'pl-4'} pr-10 py-2.5 
            border border-slate-300 rounded-lg text-sm 
            bg-white hover:border-slate-400 cursor-pointer 
            outline-none focus:ring-2 focus:ring-slate-800 
            transition-all appearance-none shadow-sm
            ${className || ''}
          `}
        >
          {children}
        </select>
        <div className="absolute right-3 top-0 h-full flex items-center pointer-events-none text-slate-400">
          <span className="material-symbols-outlined text-[20px]">expand_more</span>
        </div>
      </div>
      {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
    </div>
  );
};

export default CustomSelect;
