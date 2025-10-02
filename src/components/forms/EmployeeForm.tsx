// components/EmployeeForm.tsx
"use client";
import React, { useState } from "react";
import { X, Plus, ChevronDown } from "lucide-react";
import { Employee, MeasurementField, FormMode } from "@/types/CustomerMeasurement.types";

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

  // Track which employee is currently open (only one at a time)
  const [openEmployeeIndex, setOpenEmployeeIndex] = useState<number | null>(null);

  const toggleEmployee = (index: number) => {
    setOpenEmployeeIndex(openEmployeeIndex === index ? null : index);
  };

  // When a new employee is added, automatically open it and close others
  React.useEffect(() => {
    if (employees.length > 0) {
      setOpenEmployeeIndex(employees.length - 1); // Open the last (newest) employee
    }
  }, [employees.length]);

  return (
    <div className="space-y-4">
      {/* Fixed Header with proper spacing */}
      <div className="sticky top-0 bg-white z-10 pt-4 pb-4 -mx-6 px-6 border-b border-gray-200">
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
      </div>

      {employees.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No employees added yet.</p>
          {!isDisabled && (
            <p className="text-sm mt-1">Click "Add Employee" to get started.</p>
          )}
        </div>
      )}

      <div className="space-y-4">
        {employees.map((employee, index) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Employee Header - Always Visible */}
            <div 
              className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleEmployee(index)}
            >
              <div className="flex items-center gap-3 flex-1">
                <button
                  type="button"
                  className="text-gray-600 hover:text-gray-800 focus:outline-none"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
                <div>
                  <h4 className="font-medium text-gray-900">
                    Employee {index + 1}
                  </h4>
                  {employee.employee_code && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      Employee Code: {employee.employee_code}<br/>
                      Employee Name: {employee.employee_name} 
                    </p>
                  )}
                </div>
              </div>
              {!isDisabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveEmployee(index);
                  }}
                  className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Employee Details - Collapsible */}
            {openEmployeeIndex === index && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Employee Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employee Code <span>*</span>
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
                      Employee Name <span>*</span>
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeForm;