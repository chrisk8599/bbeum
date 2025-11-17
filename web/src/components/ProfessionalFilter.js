'use client';
import { useState, useRef, useEffect } from 'react';

export default function ProfessionalFilter({ professionals, selectedIds, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (professionalId) => {
    if (selectedIds.includes(professionalId)) {
      onChange(selectedIds.filter(id => id !== professionalId));
    } else {
      onChange([...selectedIds, professionalId]);
    }
  };

  const handleSelectAll = () => {
    onChange(professionals.map(p => p.id));
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  const selectedCount = selectedIds.length;
  const totalCount = professionals.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-neutral-200 rounded-xl hover:border-primary-300 hover:bg-gradient-beige-light transition-all text-sm font-medium text-neutral-700 shadow-sm"
      >
        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <span className="font-medium">Filter Team</span>
        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-bold">
          {selectedCount}/{totalCount}
        </span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 bg-white border-2 border-neutral-200 rounded-xl shadow-xl z-50 min-w-[280px] overflow-hidden">
          {/* Select/Deselect all */}
          <div className="p-3 bg-gradient-beige-light border-b border-neutral-200 flex gap-2">
            <button
              onClick={handleSelectAll}
              className="flex-1 px-4 py-2 text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              className="flex-1 px-4 py-2 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              Deselect All
            </button>
          </div>

          {/* Professional list */}
          <div className="max-h-[320px] overflow-y-auto p-2">
            {professionals.map(professional => (
              <label
                key={professional.id}
                className="flex items-center gap-3 p-3 hover:bg-gradient-beige-light rounded-lg cursor-pointer transition-colors group"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(professional.id)}
                  onChange={() => handleToggle(professional.id)}
                  className="w-4 h-4 rounded border-2 border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
                />
                
                {/* Color indicator */}
                <div
                  className="w-5 h-5 rounded-full shadow-sm border-2 border-white"
                  style={{ backgroundColor: professional.calendar_color }}
                />
                
                <div className="flex-1">
                  <div className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    {professional.display_name}
                    {professional.is_owner && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-bold">
                        Owner
                      </span>
                    )}
                  </div>
                  {professional.specialty && (
                    <div className="text-xs text-neutral-600 mt-0.5">{professional.specialty}</div>
                  )}
                </div>

                <svg 
                  className={`w-5 h-5 transition-opacity ${
                    selectedIds.includes(professional.id) ? 'opacity-100 text-primary-600' : 'opacity-0'
                  }`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}