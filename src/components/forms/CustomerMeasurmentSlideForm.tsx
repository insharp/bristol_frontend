// components/MeasurementSlideForm.tsx
"use client";
import React, { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { 
  FormMode, 
  FilterType, 
  Customer, 
  Product, 
  MeasurementField,
  Employee 
} from "@/types/CustomerMeasurement.types";
import { 
  useCustomerMeasurement,
  useCustomers,
  useProducts,
  useMeasurementFields
} from "@/hooks/useCustomerMeasurement"
import Button from "@/components/ui/button";

import MeasurementFormField from "./MeasurementFormField";
import EmployeeForm from "./EmployeeForm";

interface MeasurementSlideFormProps {
  isOpen: boolean;
  onClose: () => void;
  formMode: FormMode;
  filterType: FilterType;
  selectedItem: any;
  onSuccess: () => void;
  onEditFromView?: () => void;
  onDeleteFromView?: () => void;
}

const MeasurementSlideForm: React.FC<MeasurementSlideFormProps> = ({
  isOpen,
  onClose,
  formMode,
  filterType,
  selectedItem,
  onSuccess,
  onEditFromView,
  onDeleteFromView
}) => {
  const { 
    saveIndividualMeasurement, 
    saveCorporateMeasurement 
  } = useCustomerMeasurement();
  const { fetchCustomers } = useCustomers();
  const { fetchProducts, getCustomerProducts } = useProducts();
  const { fetchMeasurementFields } = useMeasurementFields();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [measurementFields, setMeasurementFields] = useState<MeasurementField[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMeasurementFields, setLoadingMeasurementFields] = useState(false);
  const [measurementFieldsError, setMeasurementFieldsError] = useState<string>('');

  // Form Validation State - inline errors only
  const [formErrors, setFormErrors] = useState({
    customer_id: '',
    product_id: '',
    batch_name: ''
  });

  const isDisabled = formMode === 'view';

  useEffect(() => {
    if (isOpen) {
      initializeForm();
    }
  }, [isOpen, formMode, selectedItem]);

  useEffect(() => {
    const customerId = formData[filterType === 'individual' ? 'customer_id' : 'corporate_customer_id'];
    if (customerId && isOpen) {
      loadCustomerProducts(customerId);
    }
  }, [formData.customer_id, formData.corporate_customer_id, filterType, isOpen]);

  // Clear form errors when form data changes
  useEffect(() => {
    const hasErrors = Object.values(formErrors).some(error => error !== '');
    if (hasErrors) {
      setFormErrors({
        customer_id: '',
        product_id: '',
        batch_name: ''
      });
    }
  }, [formData]);

  const initializeForm = async () => {
    setLoading(true);
    setMeasurementFieldsError('');
    setFormErrors({
      customer_id: '',
      product_id: '',
      batch_name: ''
    });
    
    try {
      await loadCustomers();

      if (selectedItem && (formMode === 'edit' || formMode === 'view')) {
        let transformedItem = { ...selectedItem };
        
        if (selectedItem.measurements && Array.isArray(selectedItem.measurements)) {
          transformedItem.measurements = selectedItem.measurements.reduce((acc: Record<string, any>, measurement: any) => {
            acc[measurement.field_id] = measurement.value;
            return acc;
          }, {});
        }
        
        setFormData(transformedItem);
        
        const customerId = transformedItem[filterType === 'individual' ? 'customer_id' : 'corporate_customer_id'];
        if (customerId) {
          await loadCustomerProducts(customerId);
        }
        
        if (selectedItem.product_id) {
          await loadMeasurementFields(selectedItem.product_id);
        }
        
        if (filterType === 'corporate' && selectedItem.employees) {
          const transformedEmployees = selectedItem.employees.map((employee: any) => {
            const transformedEmployee = { ...employee };
            
            if (employee.measurements) {
              transformedEmployee.measurements = {};
              Object.keys(employee.measurements).forEach(fieldId => {
                const measurement = employee.measurements[fieldId];
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
        setProducts([]);
      }
    } catch (err) {
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

  const loadCustomerProducts = async (customerId: string) => {
    try {
      const data = await getCustomerProducts(customerId, filterType);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load customer products:', err);
      try {
        const allProducts = await fetchProducts();
        setProducts(allProducts);
      } catch (fallbackErr) {
        throw new Error('Failed to load products');
      }
    }
  };

  const loadMeasurementFields = async (productId: string) => {
    setLoadingMeasurementFields(true);
    setMeasurementFieldsError('');
    
    try {
      const data = await fetchMeasurementFields(productId);
      setMeasurementFields(data);
      
      if (!data || data.length === 0) {
        setMeasurementFieldsError(
          `No measurement fields are configured for this product. Please add measurement fields before creating measurements.`
        );
      }
    } catch (err) {
      setMeasurementFieldsError('Failed to load measurement fields for this product');
      setMeasurementFields([]);
    } finally {
      setLoadingMeasurementFields(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    setFormData({
      ...formData,
      [filterType === 'individual' ? 'customer_id' : 'corporate_customer_id']: customerId,
      product_id: ''
    });
    setMeasurementFields([]);
    setMeasurementFieldsError('');
  };

  const handleProductChange = async (productId: string) => {
    setFormData({ ...formData, product_id: productId });
    
    if (productId) {
      await loadMeasurementFields(productId);
    } else {
      setMeasurementFields([]);
      setMeasurementFieldsError('');
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
    const errors = {
      customer_id: '',
      product_id: '',
      batch_name: ''
    };
    
    let isValid = true;

    // Customer validation
    const customerIdField = filterType === 'individual' ? 'customer_id' : 'corporate_customer_id';
    if (!formData[customerIdField]) {
      errors.customer_id = `${filterType === 'individual' ? 'Customer' : 'Corporate Customer'} ID is required`;
      isValid = false;
    }

    // Product validation
    if (!formData.product_id) {
      errors.product_id = 'Product ID is required';
      isValid = false;
    } else if (measurementFields.length === 0 && !loadingMeasurementFields) {
      errors.product_id = 'No measurement fields configured for this product';
      isValid = false;
    }

    // Corporate-specific validations
    if (filterType === 'corporate') {
      if (!formData.batch_name?.trim()) {
        errors.batch_name = 'Batch Name is required';
        isValid = false;
      }

      // CRITICAL: Must have at least one employee
      if (employees.length === 0) {
        isValid = false;
      }

      // Validate employees silently
      for (let i = 0; i < employees.length; i++) {
        const employee = employees[i];
        if (!employee.employee_code?.trim() || !employee.employee_name?.trim()) {
          isValid = false;
          break;
        }

        // Validate employee measurements silently
        if (measurementFields.length > 0) {
          for (const field of measurementFields) {
            if (field.required) {
              const value = employee.measurements?.[field.id];
              if (!value || value.toString().trim() === '') {
                isValid = false;
                break;
              }
            }
          }
          if (!isValid) break;
        }
      }
    }

    // Validate individual measurements silently
    if (filterType === 'individual' && formData.product_id && measurementFields.length > 0) {
      for (const field of measurementFields) {
        if (field.required) {
          const value = formData.measurements?.[field.id];
          if (!value || value.toString().trim() === '') {
            isValid = false;
            break;
          }
        }
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);

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
    } catch (err: any) {
      console.error('Save error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = () => {
  // Only disable if actively submitting
  if (submitting) return false;
  return true;
};

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
        {/* Header - Fixed */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white flex-shrink-0">
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

        {/* Error Message - Fixed */}
        {measurementFieldsError && (
          <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-md p-4 flex-shrink-0">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-amber-800 text-sm font-medium mb-1">
                  No Measurement Fields Available
                </div>
                <div className="text-amber-700 text-sm">{measurementFieldsError}</div>
              </div>
            </div>
          </div>
        )}

        {/* Warning for corporate measurements without employees */}
        {filterType === 'corporate' && employees.length === 0 && formData.product_id && !loading && (
          <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-md p-4 flex-shrink-0">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-amber-800 text-sm font-medium mb-1">
                  No Employees Added
                </div>
                <div className="text-amber-700 text-sm">
                  You must add at least one employee before you can save this corporate measurement.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {filterType === 'individual' ? 'Customer ID' : 'Corporate Customer ID'}{' '}
                    <span>*</span>
                  </label>
                  <select
                    value={formData[filterType === 'individual' ? 'customer_id' : 'corporate_customer_id'] || ''}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      formErrors.customer_id 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } ${isDisabled ? 'bg-gray-100' : ''}`}
                    disabled={isDisabled}
                  >
                    <option value="" disabled hidden>Select Customer ID</option>
                    {customers.map((customer: any) => {
                      const customerName = customer.customer_name || 
                                          customer.name || 
                                          customer.company_name || 
                                          customer.corporate_name || 
                                          'Unknown';
                      
                      return (
                        <option key={customer.id} value={customer.id}>
                          {customer.id} - {customerName}
                        </option>
                      );
                    })}
                  </select>
                  {formErrors.customer_id && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.customer_id}</p>
                  )}
                  {customers.length === 0 && !loading && (
                    <p className="mt-1 text-sm text-gray-500">No customers available.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product ID <span>*</span>
                  </label>
                  <select
                    value={formData.product_id || ''}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      formErrors.product_id 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } ${isDisabled ? 'bg-gray-100' : ''}`}
                    disabled={isDisabled || !formData[filterType === 'individual' ? 'customer_id' : 'corporate_customer_id']}
                  >
                    <option value="" disabled hidden>
                      {!formData[filterType === 'individual' ? 'customer_id' : 'corporate_customer_id'] 
                        ? 'Select customer first'
                        : 'Select Product ID'
                      }
                    </option>
                    {products.map((product: any) => (
                      <option key={product.id} value={product.id}>
                        {product.id} - {product.category_name}
                        {(!product.customer_id || product.customer_id === '' || product.customer_id === '0') && ' (Default)'}
                        {product.customer_id === formData[filterType === 'individual' ? 'customer_id' : 'corporate_customer_id'] && ' (Custom)'}
                      </option>
                    ))}
                  </select>
                  {formErrors.product_id && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.product_id}</p>
                  )}
                  {formData[filterType === 'individual' ? 'customer_id' : 'corporate_customer_id'] && products.length === 0 && !loading && (
                    <p className="mt-1 text-sm text-gray-500">No products available for this customer.</p>
                  )}
                </div>

                {loadingMeasurementFields && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading measurement fields...</span>
                  </div>
                )}

                {filterType === 'corporate' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batch Name <span>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.batch_name || ''}
                      onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        formErrors.batch_name 
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      } ${isDisabled ? 'bg-gray-100' : ''}`}
                      disabled={isDisabled}
                      placeholder="Enter batch name"
                    />
                    {formErrors.batch_name && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.batch_name}</p>
                    )}
                  </div>
                )}

                {filterType === 'individual' && formData.product_id && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-t pt-4">Measurements</h3>
                    
                    {measurementFields.length > 0 ? (
                     <div className="space-y-4">
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
                            inline={false}  
                          />
                        ))}
                      </div>
                    ) : !loadingMeasurementFields && measurementFieldsError && (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">
                          Cannot add measurements without measurement fields
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {filterType === 'corporate' && formData.product_id && (
                  <div className="border-t pt-4">
                    {measurementFields.length > 0 ? (
                      <EmployeeForm
                        employees={employees}
                        measurementFields={measurementFields}
                        formMode={formMode}
                        onAddEmployee={handleEmployeeAdd}
                        onRemoveEmployee={handleEmployeeRemove}
                        onUpdateEmployee={handleEmployeeUpdate}
                      />
                    ) : !loadingMeasurementFields && measurementFieldsError && (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">
                          Cannot add employee measurements without measurement fields
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </form>
        </div>

        {/* Footer Buttons - Fixed */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white">
          {formMode === 'view' ? (
            <div className="flex gap-4 px-6 py-6">
              {onDeleteFromView && onEditFromView ? (
                <>
                  <button 
                    type="button"
                    onClick={onDeleteFromView}
                    className="flex-1 font-medium text-sm py-2 text-center hover:bg-red-50 rounded-md transition-colors"
                    style={{ color: 'var(--negative-color, #D83A52)' }}
                  >
                    Delete
                  </button>
                  <button 
                    type="button"
                    onClick={onEditFromView}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-md text-sm"
                  >
                    Edit
                  </button>
                </>
              ) : (
                <div className="flex justify-end gap-3 w-full">
                  {onDeleteFromView && (
                    <button 
                      type="button"
                      onClick={onDeleteFromView}
                      className="text-red-500 hover:text-red-600 font-medium text-sm px-4 py-2 hover:bg-red-50 rounded-md transition-colors"
                    >
                      Delete
                    </button>
                  )}
                  {onEditFromView && (
                    <button 
                      type="button"
                      onClick={onEditFromView}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-md text-sm"
                    >
                      Edit
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            !loading && (
              <div className="flex gap-4 px-6 py-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 font-medium text-sm py-2 text-center hover:bg-gray-50 rounded-md transition-colors text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  onClick={handleSubmit}
                  className={`flex-1 font-medium text-sm py-2 rounded-md ${
                    canSubmit()
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-400 cursor-not-allowed text-white'
                  }`}
                  title={filterType === 'corporate' && employees.length === 0 ? 'Add at least one employee to save' : ''}
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
};

export default MeasurementSlideForm;