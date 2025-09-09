"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import ReusableTable from "@/components/ui/ReusableTable";
import SlideModal from "@/components/ui/SlideModal";
import { useMeasurementField, MeasurementField, MeasurementFieldGroup, CreateMeasurementFieldRequest } from "@/app/hooks/useMeasurement";
import { useProducts } from "@/app/hooks/useProduct";

interface MeasurementFieldManagementProps {
  title?: string;
  apiEndpoint?: string;
  permissions?: {
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canView?: boolean;
  };
  customActions?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: (measurementFieldGroup: MeasurementFieldGroup) => void;
    className?: string;
  }>;
}

// Message Modal Component
const MessageModal = ({ 
  isOpen, 
  onClose, 
  type, 
  title, 
  message 
}: {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  title: string;
  message: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-blue-50/70 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center mb-4">
            {type === 'success' ? (
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex justify-end">
            <Button
              onClick={onClose}
              className={`${
                type === 'success' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              } text-white`}
            >
              OK
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MeasurementFieldManagement: React.FC<MeasurementFieldManagementProps> = ({
  title = "Measurement Fields",
  apiEndpoint,
  permissions = {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canView: true
  },
  customActions = []
}) => {
  const {
    measurementFields,
    loading,
    fetchMeasurementFields,
    createMeasurementField,
    updateMeasurementField,
    deleteMeasurementField
  } = useMeasurementField(apiEndpoint);

  // Use products hook to get product list for dropdown
  const { products, fetchProducts } = useProducts();

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedMeasurementFieldGroup, setSelectedMeasurementFieldGroup] = useState<MeasurementFieldGroup | null>(null);
  const [formData, setFormData] = useState<CreateMeasurementFieldRequest>({
    product_id: 0,
    fields: []
  });

  // Message Modal State
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: ''
  });

  // Form Validation State
  const [formErrors, setFormErrors] = useState({
    product_id: '',
    fields: ''
  });

  // Message handlers
  const showSuccessMessage = (title: string, message: string) => {
    setMessageModal({ isOpen: true, type: 'success', title, message });
  };

  const showErrorMessage = (title: string, message: string) => {
    setMessageModal({ isOpen: true, type: 'error', title, message });
  };

  const closeMessageModal = () => {
    setMessageModal({ ...messageModal, isOpen: false });
  };

  // Form validation
  const validateForm = () => {
    const errors = {
      product_id: '',
      fields: ''
    };

    if (!formData.product_id || formData.product_id === 0) {
      errors.product_id = 'Product selection is required';
    }

    if (formData.fields.length === 0) {
      errors.fields = 'At least one measurement field is required';
    } else {
      // Validate each field
      for (let i = 0; i < formData.fields.length; i++) {
        const field = formData.fields[i];
        if (!field.field_name.trim()) {
          errors.fields = `Field name is required for field ${i + 1}`;
          break;
        }
        if (!field.field_type.trim()) {
          errors.fields = `Field type is required for field ${i + 1}`;
          break;
        }
        if (!field.unit.trim()) {
          errors.fields = `Unit is required for field ${i + 1}`;
          break;
        }
      }
    }

    setFormErrors(errors);
    return Object.values(errors).every(error => !error);
  };

  // Clear form errors when form data changes
  useEffect(() => {
    const hasErrors = Object.values(formErrors).some(error => error !== '');
    if (hasErrors) {
      setFormErrors({
        product_id: '',
        fields: ''
      });
    }
  }, [formData]);

  // Initial fetch
  useEffect(() => {
    fetchMeasurementFields().then(result => {
      if (!result.success) {
        showErrorMessage('Fetch Error', result.error || 'Failed to load measurement fields');
      }
    });
    
    fetchProducts().then(result => {
      if (!result.success) {
        showErrorMessage('Fetch Error', result.error || 'Failed to load products');
      }
    });
  }, []);

  // Filter measurement fields based on search query
  const filteredMeasurementFields = measurementFields.filter(group => {
    const searchLower = searchQuery.toLowerCase();
    const productName = products.find(p => p.id === group.product_id.toString())?.category_name || '';
    return (
      productName.toLowerCase().includes(searchLower) ||
      group.measurement_fields.some(field => 
        field.field_name.toLowerCase().includes(searchLower) ||
        field.field_type.toLowerCase().includes(searchLower) ||
        field.unit.toLowerCase().includes(searchLower)
      )
    );
  });

  // Table columns - simplified to only show product and field count
  const columns = [
    { 
      key: "product_id", 
      label: "Product", 
      minWidth: "50px",
      render: (value: number) => {
        const product = products.find(p => p.id === value.toString());
        return (
          <span className="font-medium text-blue-600">
            {product ? product.category_name : value}
          </span>
        );
      }
    },

    { 
      key: "product_name", 
      label: "Product", 
      minWidth: "50px",
      render: (value: number) => {
        const product = products.find(p => p.id === value.toString());
        return (
          <span className="font-medium text-blue-600">
            {product ? product.category_name : value}
          </span>
        );
      }
    },

    { 
      key: "field_count", 
      label: "Field Count", 
    
      render: (value: any, row: MeasurementFieldGroup) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row.measurement_fields.length} field{row.measurement_fields.length !== 1 ? 's' : ''}
        </span>
      )
    }
  ];

  // Table actions based on permissions
  const getActions = () => {
    const defaultActions = [];

    if (permissions.canView) {
      defaultActions.push({
        label: "View",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ),
        onClick: (group: MeasurementFieldGroup) => {
          setSelectedMeasurementFieldGroup(group);
          setModalMode("view");
          setIsModalOpen(true);
        },
      });
    }

    // if (permissions.canEdit) {
    //   defaultActions.push({
    //     label: "Edit",
    //     icon: (
    //       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    //       </svg>
    //     ),
    //     onClick: (group: MeasurementFieldGroup) => {
    //       setSelectedMeasurementFieldGroup(group);
    //       setFormData({
    //         product_id: group.product_id,
    //         fields: group.measurement_fields.map(field => ({
    //           field_name: field.field_name,
    //           field_type: field.field_type,
    //           unit: field.unit,
    //           is_required: field.is_required 
    //         }))
    //       });
    //       setModalMode("edit");
    //       setIsModalOpen(true);
    //     },
    //   });
    // }

    if (permissions.canDelete) {
      defaultActions.push({
        label: "Delete All",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ),
        onClick: (group: MeasurementFieldGroup) => {
          const productName = products.find(p => p.id === group.product_id.toString())?.category_name || `Product ID: ${group.product_id}`;
          if (window.confirm(`Are you sure you want to delete all measurement fields for "${productName}"?`)) {
            handleDeleteAllFieldsForProduct(group);
          }
        },
        className: "text-red-600 hover:bg-red-50",
      });
    }

    return [...defaultActions, ...customActions];
  };

  // Modal handlers
  const openCreateModal = () => {
    if (!permissions.canCreate) return;
    
    setSelectedMeasurementFieldGroup(null);
    setFormData({
      product_id: 0,
      fields: []
    });
    setFormErrors({
      product_id: '',
      fields: ''
    });
    setModalMode("create");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMeasurementFieldGroup(null);
    setFormErrors({
      product_id: '',
      fields: ''
    });
  };

  // Field management functions
  const addField = () => {
    setFormData({
      ...formData,
      fields: [...formData.fields, { field_name: '', field_type: '', unit: '', is_required: "true" }]
    });
  };

  const removeField = (index: number) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((_, i) => i !== index)
    });
  };

  const updateField = (index: number, field: Partial<CreateMeasurementFieldRequest['fields'][0]>) => {
    const updatedFields = [...formData.fields];
    updatedFields[index] = { ...updatedFields[index], ...field };
    setFormData({ ...formData, fields: updatedFields });
  };

  // CRUD handlers
  const handleCreateMeasurementField = async () => {
    const result = await createMeasurementField(formData);
    if (result.success) {
      closeModal();
      const productName = products.find(p => p.id === formData.product_id.toString())?.category_name || 'Selected Product';
      showSuccessMessage('Success!', result.message || `Measurement fields for "${productName}" have been created successfully.`);
    } else {
      showErrorMessage('Creation Failed', result.error || 'Failed to create measurement field');
    }
  };

  const handleDeleteAllFieldsForProduct = async (group: MeasurementFieldGroup) => {
    // Delete all fields for this product one by one
    let allDeleted = true;
    for (const field of group.measurement_fields) {
      const result = await deleteMeasurementField(field.id);
      if (!result.success) {
        allDeleted = false;
        showErrorMessage('Deletion Failed', result.error || `Failed to delete field "${field.field_name}"`);
        break;
      }
    }
    
    if (allDeleted) {
      const productName = products.find(p => p.id === group.product_id.toString())?.category_name || 'Product';
      showSuccessMessage('Success!', `All measurement fields for "${productName}" have been deleted successfully.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (modalMode === "create") {
      handleCreateMeasurementField();
    }
    // Note: Edit mode would need individual field updates - not implemented in this version
  };

  const getModalTitle = () => {
    switch (modalMode) {
      case "create": return "Add New Measurement Fields";
      case "edit": return "Edit Measurement Fields";
      case "view": return "View Measurement Fields";
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <main className="flex-1 p-8 bg-blue-50/40 rounded-2xl flex flex-col overflow-hidden">
        {/* Fixed Header Section */}
        <div className="flex-shrink-0 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {permissions.canCreate && (
              <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
                + Add Measurement Fields
              </Button>
            )}
          </div>

          {/* Search Section */}
          {/* <div className="mb-6">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search measurement fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div> */}
        </div>

        {/* Flexible Table Container */}
        <div className="flex-1 min-h-0">
          <ReusableTable
            data={filteredMeasurementFields}
            columns={columns}
            actions={getActions()}
            loading={loading}
            emptyMessage="No measurement fields found."
          />
        </div>


        {/* Modal for Create */}
        {modalMode === "create" && (
          <SlideModal isOpen={isModalOpen} onClose={closeModal} title={getModalTitle()}>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Product *</label>
                <select
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: parseInt(e.target.value) })}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    formErrors.product_id ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2`}
                  required
                >
                  <option value={0}>Select a product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={parseInt(product.id)}>
                      {product.category_name}
                    </option>
                  ))}
                </select>
                {formErrors.product_id && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.product_id}</p>
                )}
              </div>

              {/* Measurement Fields */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium">Measurement Fields *</label>
                  <Button
                    type="button"
                    onClick={addField}
                    className="bg-green-600 hover:bg-green-700 text-sm px-3 py-1"
                  >
                    + Add Field
                  </Button>
                </div>
                
                {formData.fields.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-500 text-sm mt-2">No measurement fields added yet</p>
                    <p className="text-gray-400 text-xs mt-1">Click "Add Field" to create your first measurement field</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {formData.fields.map((field, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Field {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeField(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">Field Name</label>
                            <input
                              type="text"
                              value={field.field_name}
                              onChange={(e) => updateField(index, { field_name: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="e.g., waist, hip, bust"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium mb-1">Field Type</label>
                            <select
                              value={field.field_type}
                              onChange={(e) => updateField(index, { field_type: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">Select type...</option>
                              <option value="float">Float</option>
                              <option value="integer">Integer</option>
                              <option value="text">Text</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">Unit</label>
                            <input
                              type="text"
                              value={field.unit}
                              onChange={(e) => updateField(index, { unit: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="e.g., cm, inches, kg"
                            />
                          </div>
                          
                          {/* <div className="flex items-center pt-6">
                            <input
                              type="checkbox"
                              id={`required-${index}`}
                              checked={field.is_required}
                              onChange={(e) => updateField(index, { is_required: e.target.checked })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`required-${index}`} className="ml-2 block text-xs text-gray-700">
                              Required field
                            </label>
                          </div> */}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {formErrors.fields && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.fields}</p>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create Measurement Fields
                </Button>
              </div>
            </form>
          </SlideModal>
        )}

        {/* Modal for View */}
        {modalMode === "view" && selectedMeasurementFieldGroup && (
          <SlideModal isOpen={isModalOpen} onClose={closeModal} title={getModalTitle()}>
            <div className="p-6 space-y-6">
              {/* Product Info */}
              <div>
                <label className="block text-sm font-medium mb-2">Product</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="font-medium text-blue-600">
                    {products.find(p => p.id === selectedMeasurementFieldGroup.product_id.toString())?.category_name || `Product ID: ${selectedMeasurementFieldGroup.product_id}`}
                  </span>
                </div>
              </div>

              {/* Measurement Fields Display */}
              <div>
                <label className="block text-sm font-medium mb-3">Measurement Fields ({selectedMeasurementFieldGroup.measurement_fields.length})</label>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedMeasurementFieldGroup.measurement_fields.map((field, index) => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-medium text-gray-700">Field {index + 1}</h4>
                        <span className="text-xs text-gray-500">ID: {field.id}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-600">Field Name</label>
                          <div className="px-2 py-1 text-sm bg-white border border-gray-200 rounded">
                            {field.field_name}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-600">Field Type</label>
                          <div className="px-2 py-1 text-sm bg-white border border-gray-200 rounded">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {field.field_type}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-600">Unit</label>
                          <div className="px-2 py-1 text-sm bg-white border border-gray-200 rounded">
                            {field.unit}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-600">Required</label>
                          {/* <div className="px-2 py-1 text-sm bg-white border border-gray-200 rounded">
                            {(field.is_required === "true" || field.is_required === true) ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                ✓ Required
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Optional
                              </span>
                            )}
                          </div> */}
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                          <div>
                            <span className="font-medium">Created:</span><br />
                            {new Date(field.created_at).toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Updated:</span><br />
                            {new Date(field.updated_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SlideModal>
        )}

        {/* Message Modal */}
        <MessageModal
          isOpen={messageModal.isOpen}
          onClose={closeMessageModal}
          type={messageModal.type}
          title={messageModal.title}
          message={messageModal.message}
        />
      </main>
    </div>
  );
};

export default MeasurementFieldManagement;