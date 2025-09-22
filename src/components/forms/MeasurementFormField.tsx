// components/MeasurementFormField.tsx
"use client";
import React from "react";
import { MeasurementField } from "@/app/types/CustomerMeasurement.types";

interface MeasurementFormFieldProps {
  field: MeasurementField;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  inline?: boolean; // New prop to control horizontal layout
}

const MeasurementFormField: React.FC<MeasurementFormFieldProps> = ({
  field,
  value,
  onChange,
  disabled = false,
  inline = false
}) => {
  const baseClassName = `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
    disabled ? 'bg-gray-100' : ''
  }`;

  const renderField = () => {
    switch (field.field_type) {
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseClassName}
            disabled={disabled}
            required={field.required}
          >
            <option value="">Select {field.field_name}</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseClassName}
            disabled={disabled}
            required={field.required}
            step="any"
            placeholder={`Enter ${field.field_name.toLowerCase()}`}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseClassName}
            disabled={disabled}
            required={field.required}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseClassName}
            disabled={disabled}
            required={field.required}
          />
        );

      default: // 'text'
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseClassName}
            disabled={disabled}
            required={field.required}
            placeholder={`Enter ${field.field_name.toLowerCase()}`}
          />
        );
    }
  };

  // Container styling based on inline prop
  const containerClassName = inline 
    ? "flex-1 min-w-[150px]" // Horizontal: flexible width with minimum
    : "mb-4"; // Vertical: original styling

  return (
    <div className={containerClassName}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.field_name} {(field as any).unit && `(${(field as any).unit})`} {field.required && <span className="text-red-500">*</span>}
      </label>
      {renderField()}
    </div>
  );
};

export default MeasurementFormField;