// components/MeasurementSlideForm.tsx
"use client";
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { 
  FormMode, 
  FilterType, 
  Customer, 
  Product, 
  MeasurementField,
  Employee 
} from "@/app/types/CustomerMeasurement.types";
import { 
  useCustomerMeasurement,
  useCustomers,
  useProducts,
  useMeasurementFields
} from "@/app/hooks/useCustomerMeasurement"

import MeasurementFormField from "./MeasurementFormField";
import EmployeeForm from "./EmployeeForm";





interface MeasurementSlideFormProps {
  isOpen: boolean;
  onClose: () => void;
  formMode: FormMode;
  filterType: FilterType;
  selectedItem: any;
  onSuccess: () => void;
}

const MeasurementSlideForm: React.FC<MeasurementSlideFormProps> = ({
  isOpen,
  onClose,
  formMode,
  filterType,
  selectedItem,
  onSuccess
}) => {
  // Custom hooks
  const { 
    saveIndividualMeasurement, 
    saveCorporateMeasurement 
  } = useCustomerMeasurement();
  const { fetchCustomers } = useCustomers();
  const { fetchProducts } = useProducts();
  const { fetchMeasurementFields } = useMeasurementFields();

  // Form state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [measurementFields, setMeasurementFields] = useState<MeasurementField[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const isDisabled = formMode === 'view';

  // Initialize form when opened
  useEffect(() => {
    if (isOpen) {
      initializeForm();
    }
  }, [isOpen, formMode, selectedItem]);


 const initializeForm = async () => {
  setLoading(true);
  setError('');
  
  try {
    await Promise.all([
      loadCustomers(),
      loadProducts()
    ]);

    if (selectedItem && (formMode === 'edit' || formMode === 'view')) {
      // Transform measurements array to object
      let transformedItem = { ...selectedItem };
      
      if (selectedItem.measurements && Array.isArray(selectedItem.measurements)) {
        // Convert array to object: [field_id]: value
        transformedItem.measurements = selectedItem.measurements.reduce((acc: Record<string, any>, measurement: any) => {
          acc[measurement.field_id] = measurement.value;
          return acc;
        }, {});
      }
      
      setFormData(transformedItem);
      
      if (selectedItem.product_id) {
        await loadMeasurementFields(selectedItem.product_id);
      }
      
      // Load employees for corporate
if (filterType === 'corporate' && selectedItem.employees) {
  // Transform employee measurements from objects to simple values
  const transformedEmployees = selectedItem.employees.map((employee: any) => {
    const transformedEmployee = { ...employee };
    
    if (employee.measurements) {
      transformedEmployee.measurements = {};
      // Convert measurement objects to simple values
      Object.keys(employee.measurements).forEach(fieldId => {
        const measurement = employee.measurements[fieldId];
        // Extract just the value from the measurement object
        transformedEmployee.measurements[fieldId] = measurement?.value || measurement;
      });
    }
    
    return transformedEmployee;
  });
  
  setEmployees(transformedEmployees);
}
    } else {
      setFormData({});
      setEmployees([]);
      setMeasurementFields([]);
    }
  } catch (err) {
    setError('Failed to initialize form');
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  const loadCustomers = async () => {
    try {
      const data = await fetchCustomers(filterType);
      setCustomers(data);
    } catch (err) {
      throw new Error('Failed to load customers');
    }
  };

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      throw new Error('Failed to load products');
    }
  };

  const loadMeasurementFields = async (productId: string) => {
    try {
      const data = await fetchMeasurementFields(productId);
      setMeasurementFields(data);
    //   console.log(data)
    } catch (err) {
      throw new Error('Failed to load measurement fields');
    }
  };

  const handleProductChange = async (productId: string) => {
    setFormData({ ...formData, product_id: productId });
    
    if (productId) {
      await loadMeasurementFields(productId);
    } else {
      setMeasurementFields([]);
    }
  };

  const handleEmployeeAdd = () => {
    setEmployees([...employees, { 
      employee_code: '', 
      employee_name: '', 
      measurements: {} 
    }]);
  };

  const handleEmployeeRemove = (index: number) => {
    setEmployees(employees.filter((_, i) => i !== index));
  };

  const handleEmployeeUpdate = (index: number, field: string, value: any) => {
    const updated = [...employees];
    if (field.startsWith('measurements.')) {
      const measurementField = field.replace('measurements.', '');
      updated[index].measurements[measurementField] = value;
    } else {
      updated[index][field as keyof Employee] = value;
    }
    setEmployees(updated);
  };

  const validateForm = (): boolean => {
    setError('');

    if (filterType === 'individual') {
      if (!formData.customer_id) {
        setError('Customer ID is required');
        return false;
      }
      if (!formData.product_id) {
        setError('Product ID is required');
        return false;
      }
    } else {
      if (!formData.corporate_customer_id) {
        setError('Corporate Customer ID is required');
        return false;
      }
      if (!formData.product_id) {
        setError('Product ID is required');
        return false;
      }
      if (!formData.batch_name?.trim()) {
        setError('Batch Name is required');
        return false;
      }
      if (employees.length === 0) {
        setError('At least one employee is required');
        return false;
      }
      
      // Validate employees
      for (let i = 0; i < employees.length; i++) {
        const employee = employees[i];
        if (!employee.employee_code?.trim()) {
          setError(`Employee ${i + 1}: Employee Code is required`);
          return false;
        }
        if (!employee.employee_name?.trim()) {
          setError(`Employee ${i + 1}: Employee Name is required`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    setError('');

    try {
      let payload = { ...formData };
      
      if (filterType === 'corporate') {
        payload.employees = employees;
        payload.no_of_employees = employees.length;
      }

      const isEdit = formMode === 'edit';
      
      if (filterType === 'individual') {
        await saveIndividualMeasurement(payload, isEdit);
      } else {
        await saveCorporateMeasurement(payload, isEdit);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to save measurement');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Form Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            {formMode === 'add' ? 'Add' : formMode === 'edit' ? 'Edit' : 'View'}{' '}
            {filterType === 'individual' ? 'Individual' : 'Corporate'} Measurement
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex justify-between items-start">
              <div className="text-red-800 text-sm">{error}</div>
              <button
                onClick={() => setError('')}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {filterType === 'individual' ? 'Customer ID' : 'Corporate Customer ID'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData[filterType === 'individual' ? 'customer_id' : 'corporate_customer_id'] || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    [filterType === 'individual' ? 'customer_id' : 'corporate_customer_id']: e.target.value
                  })}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isDisabled ? 'bg-gray-100' : ''
                  }`}
                  disabled={isDisabled}
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.id} - {customer.customer_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product ID <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.product_id || ''}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isDisabled ? 'bg-gray-100' : ''
                  }`}
                  disabled={isDisabled}
                  required
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.id} - {product.category_name}
                    </option>
                  ))}
                </select>
              </div>


              {/* Corporate-specific: Batch Name */}
              {filterType === 'corporate' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.batch_name || ''}
                    onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isDisabled ? 'bg-gray-100' : ''
                    }`}
                    disabled={isDisabled}
                    required
                    placeholder="Enter batch name"
                  />
                </div>
              )}

              {/* Individual measurements */}
              {filterType === 'individual' && measurementFields.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-t pt-4">Measurements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {measurementFields.map((field) => (
                      <MeasurementFormField
                        key={field.id}
                        field={field}
                        value={formData.measurements?.[field.id] || ''}
                        onChange={(value) => setFormData({
                          ...formData,
                          measurements: {
                            ...formData.measurements,
                            [field.id]: value
                          }
                        })}

                        disabled={isDisabled}
                      />
                    ))}
                  </div>
                </div>
              )}


              {/* Corporate employees */}
              {filterType === 'corporate' && (
                <div className="border-t pt-4">
                  <EmployeeForm
                    employees={employees}
                    measurementFields={measurementFields}
                    formMode={formMode}
                    onAddEmployee={handleEmployeeAdd}
                    onRemoveEmployee={handleEmployeeRemove}
                    onUpdateEmployee={handleEmployeeUpdate}
                  />
                </div>
              )}

              {/* Form Actions */}
              {!isDisabled && (
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 bg-white sticky bottom-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : (formMode === 'add' ? 'Add Measurement' : 'Update Measurement')}
                  </button>
                </div>
              )}
            </>
          )}
        </form>
      </div>
    </>
  );
};

export default MeasurementSlideForm;