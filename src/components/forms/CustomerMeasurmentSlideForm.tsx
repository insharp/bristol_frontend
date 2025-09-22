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
} from "@/app/types/CustomerMeasurement.types";
import { 
  useCustomerMeasurement,
  useCustomers,
  useProducts,
  useMeasurementFields
} from "@/app/hooks/useCustomerMeasurement"
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
  // New props for view mode actions
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
  // Custom hooks
  const { 
    saveIndividualMeasurement, 
    saveCorporateMeasurement 
  } = useCustomerMeasurement();
  const { fetchCustomers } = useCustomers();
  const { fetchProducts, getCustomerProducts } = useProducts();
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
  const [loadingMeasurementFields, setLoadingMeasurementFields] = useState(false);
  const [measurementFieldsError, setMeasurementFieldsError] = useState<string>('');

  const isDisabled = formMode === 'view';

  // Initialize form when opened
  useEffect(() => {
    if (isOpen) {
      initializeForm();
    }
  }, [isOpen, formMode, selectedItem]);

  // Load customer-specific products when customer changes
  useEffect(() => {
    const customerId = formData[filterType === 'individual' ? 'customer_id' : 'corporate_customer_id'];
    if (customerId && isOpen) {
      loadCustomerProducts(customerId);
    }
  }, [formData.customer_id, formData.corporate_customer_id, filterType, isOpen]);

  const initializeForm = async () => {
    setLoading(true);
    setError('');
    setMeasurementFieldsError('');
    
    try {
      await loadCustomers();

      if (selectedItem && (formMode === 'edit' || formMode === 'view')) {
        // Transform measurements array to object
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

  const loadCustomerProducts = async (customerId: string) => {
    try {
      console.log('Loading products for customer:', customerId);
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
      
      // Check if no measurement fields exist for this product
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
    setError('');

    // Check if measurement fields are loaded and available
    if (formData.product_id && measurementFields.length === 0 && !loadingMeasurementFields) {
      setError('Cannot create measurements: No measurement fields are configured for the selected product. Please contact the administrator to add measurement fields first.');
      return false;
    }

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

  // Check if form can be submitted
  const canSubmit = () => {
    if (isDisabled) return false;
    if (submitting) return false;
    if (loadingMeasurementFields) return false;
    if (formData.product_id && measurementFields.length === 0) return false;
    return true;
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
      <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto flex flex-col">
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
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-red-800 text-sm">{error}</div>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Measurement Fields Warning */}
        {measurementFieldsError && (
          <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-md p-4">
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

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
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
                    <span >*</span>
                  </label>
                  <select
                    value={formData[filterType === 'individual' ? 'customer_id' : 'corporate_customer_id'] || ''}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isDisabled ? 'bg-gray-100' : ''
                    }`}
                    disabled={isDisabled}
                    required
                  >
                    <option value="">Select Customer ID</option>
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
                </div>

                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product ID <span>*</span>
                  </label>
                  <select
                    value={formData.product_id || ''}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isDisabled ? 'bg-gray-100' : ''
                    }`}
                    disabled={isDisabled || !formData[filterType === 'individual' ? 'customer_id' : 'corporate_customer_id']}
                    required
                  >
                    <option value="">
                      {!formData[filterType === 'individual' ? 'customer_id' : 'corporate_customer_id'] 
                        ? 'Select customer first'
                        : 'Select Product'
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
                  {formData[filterType === 'individual' ? 'customer_id' : 'corporate_customer_id'] && products.length === 0 && !loading && (
                    <p className="mt-1 text-sm text-gray-500">
                      No products available for this customer.
                    </p>
                  )}
                </div>

                {/* Loading indicator for measurement fields */}
                {loadingMeasurementFields && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading measurement fields...</span>
                  </div>
                )}

                {/* Corporate-specific: Batch Name */}
                {filterType === 'corporate' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batch Name <span>*</span>
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

                {/* Corporate employees */}
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

        {/* Action Buttons - Different layouts for view vs edit/add */}
        {formMode === 'view' ? (
          // View mode: Show Edit and Delete buttons
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 bg-white px-6 pb-6">
            {onDeleteFromView && (
              <Button 
                type="button"
                onClick={onDeleteFromView}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            )}
            {onEditFromView && (
              <Button 
                type="button"
                onClick={onEditFromView}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Edit
              </Button>
            )}
          </div>
        ) : (
          // Edit/Add mode: Show form submission button
          !loading && (
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 bg-white px-6 pb-6">
              <button
                type="submit"
                disabled={!canSubmit()}
                onClick={handleSubmit}
                className={`px-6 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  canSubmit()
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                title={
                  !canSubmit() && formData.product_id && measurementFields.length === 0
                    ? 'Cannot submit: No measurement fields available for selected product'
                    : undefined
                }
              >
                {submitting ? 'Saving...' : (formMode === 'add' ? 'Add Measurement' : 'Update Measurement')}
              </button>
            </div>
          )
        )}
      </div>
    </>
  );
};

export default MeasurementSlideForm;