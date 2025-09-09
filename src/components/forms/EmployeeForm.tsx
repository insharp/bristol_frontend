// components/EmployeeForm.tsx
"use client";
import React from "react";
import { X, Plus } from "lucide-react";
import { Employee, MeasurementField, FormMode } from "@/app/types/CustomerMeasurement.types";

import MeasurementFormField from "@/components/forms/MeasurementFormField";

interface EmployeeFormProps {
  employees: Employee[];
  measurementFields: MeasurementField[];
  formMode: FormMode;
  onAddEmployee: () => void;
  onRemoveEmployee: (index: number) => void;
  onUpdateEmployee: (index: number, field: string, value: any) => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employees,
  measurementFields,
  formMode,
  onAddEmployee,
  onRemoveEmployee,
  onUpdateEmployee
}) => {
  const isDisabled = formMode === 'view';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Employees</h3>
        {!isDisabled && (
          <button
            type="button"
            onClick={onAddEmployee}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        )}
      </div>

      {employees.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No employees added yet.</p>
          {!isDisabled && (
            <p className="text-sm mt-1">Click "Add Employee" to get started.</p>
          )}
        </div>
      )}

      {employees.map((employee, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">Employee {index + 1}</h4>
            {!isDisabled && (
              <button
                type="button"
                onClick={() => onRemoveEmployee(index)}
                className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Employee Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={employee.employee_code}
                onChange={(e) => onUpdateEmployee(index, 'employee_code', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDisabled ? 'bg-gray-100' : ''
                }`}
                disabled={isDisabled}
                required
                placeholder="Enter employee code"
              />
            </div>

            {/* Employee Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={employee.employee_name}
                onChange={(e) => onUpdateEmployee(index, 'employee_name', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDisabled ? 'bg-gray-100' : ''
                }`}
                disabled={isDisabled}
                required
                placeholder="Enter employee name"
              />
            </div>
          </div>

          {/* Employee Measurements */}
          {measurementFields.length > 0 && (
            <div className="space-y-3">
              <h5 className="font-medium text-gray-800 border-t pt-3">Measurements</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {measurementFields.map((field) => (
                  <MeasurementFormField
                    key={field.id}
                    field={field}
                    value={employee.measurements[field.id]}
                    onChange={(value) => onUpdateEmployee(index, `measurements.${field.id}`, value)}
                    disabled={isDisabled}
                  />
                ))}
              </div>
            </div>
          )}

          {measurementFields.length === 0 && (
            <div className="text-center py-4 text-gray-500 border-t">
              <p className="text-sm">Select a product to see measurement fields</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default EmployeeForm;