// components/ReusableTable.tsx
"use client";
import React, { useState, useRef, useEffect } from "react";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string; // Optional: specify column width (e.g., "150px", "200px")
  minWidth?: string; // Optional: minimum column width
}

interface Action {
  label: string;
  icon: React.ReactNode;
  onClick: (row: any) => void;
  className?: string;
}

interface ReusableTableProps {
  data: any[];
  columns: Column[];
  actions: Action[];
  loading?: boolean;
  emptyMessage?: string;
  minColumnWidth?: string; // Default minimum width for columns
}


const ReusableTable: React.FC<ReusableTableProps> = ({
  data,
  columns,
  actions,
  loading = false,
  emptyMessage = "No data found.",
  minColumnWidth = "160px",
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement }>({});
  const tableContainerRef = useRef<HTMLDivElement>(null);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (rowId: string, row: any) => {
    if (activeDropdown === rowId) {
      setActiveDropdown(null);
    } else {
      const button = buttonRefs.current[rowId];
      const container = tableContainerRef.current;
      
      if (button && container) {
        const buttonRect = button.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Calculate position relative to the container
        const scrollLeft = container.scrollLeft;
        
        setDropdownPosition({
          top: buttonRect.top + window.scrollY,
          left: buttonRect.right + window.scrollX + 8 - scrollLeft
        });
      }
      setActiveDropdown(rowId);
    }
  };


  // Generate grid template with column widths
  const generateGridTemplate = () => {
    let template = columns.map(col => {
      if (col.width) return col.width;
      if (col.minWidth) return `minmax(${col.minWidth}, 1fr)`;
      return `minmax(${minColumnWidth}, 1fr)`;
    }).join(' ');
    
    // Add actions column
    template += ' 80px'; // Fixed width for actions
    
    return template;
  };

  const gridTemplate = generateGridTemplate();

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-pulse">
            <div className="flex space-x-4">
              <div className="rounded-full bg-gray-300 h-4 w-4"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Scrollable Container */}
          <div 
            ref={tableContainerRef}
            className="overflow-x-auto overflow-y-visible scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
            style={{ 
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
            }}
          >
            <div className="min-w-full">
              {/* Table Header */}
              <div 
                className="grid bg-gray-50 border-b border-gray-200 sticky top-0 z-10"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                {columns.map((col) => (
                  <div 
                    key={col.key} 
                    className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {col.label}
                  </div>
                ))}
                <div className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {data.length > 0 ? (
                  data.map((row, index) => {
                    const rowId = row.id || `row_${index}`;
                    return (
                      <div 
                        key={rowId} 
                        className="grid hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                        style={{ gridTemplateColumns: gridTemplate }}
                      >
                        {columns.map((col) => (
                          <div 
                            key={col.key} 
                            className="px-6 py-4 text-sm text-gray-900 break-words"
                            title={col.render ? undefined : String(row[col.key] || '')}
                          >
                            <div className="max-w-full">
                              {col.render ? col.render(row[col.key], row) : (
                                <span className="line-clamp-2">
                                  {row[col.key]}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        <div className="px-6 py-4 text-center">
                          <button
                            ref={(el) => {
                              if (el) buttonRefs.current[rowId] = el;
                            }}
                            onClick={() => toggleDropdown(rowId, row)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                            aria-label="More options"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-6 py-12 text-center">
                    <div className="text-gray-400 mb-2">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">{emptyMessage}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scroll Indicator (optional) */}
          {data.length > 0 && (
            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
              <div className="text-xs text-gray-500 text-center">
                ← Scroll horizontally to see more columns →
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dropdown Menu */}
      {activeDropdown && (
        <div
          ref={dropdownRef}
          className="fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-in slide-in-from-top-2 duration-200"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
          }}
        >
          <div className="py-1">
            {actions.map((action, index) => {
              const currentRow = data.find(row => (row.id || `row_${data.indexOf(row)}`) === activeDropdown);
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (currentRow) action.onClick(currentRow);
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 ease-in-out ${
                    action.className || "text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
                  } focus:outline-none`}
                >
                  <span className="flex items-center gap-2">
                    {action.icon}
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default ReusableTable;