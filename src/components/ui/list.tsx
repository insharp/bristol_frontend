'use client';

import React from "react";

export interface ListColumn {
  label: string;
  key: string;
}

interface ListProps {
  columns: ListColumn[];
  data: Record<string, any>[];
  columnSizes?: string[]; // e.g., ["w-1/4", "w-1/2", "w-1/4"]
}

const List: React.FC<ListProps> = ({ columns, data, columnSizes }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key}
                className={`px-4 py-2 border-b border-gray-200 text-left font-semibold ${columnSizes?.[idx] || ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-4 text-gray-400">
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50">
                {columns.map((col, colIdx) => (
                  <td
                    key={col.key}
                    className={`px-4 py-2 border-b border-gray-100 ${columnSizes?.[colIdx] || ""}`}
                  >
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default List;
