"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import ReusableTable from "@/components/ui/ReusableTable";
import SlideModal from "@/components/ui/SlideModal";
import { Trash2 } from "lucide-react";
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

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<MeasurementFieldGroup | null>(null);

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
    const product = products.find(p => 
      p.id === group.product_id.toString() || 
      parseInt(p.id) === group.product_id || 
      Number(p.id) === group.product_id
    );
    const productName = product?.category_name || '';
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
    label: "Product ID", 
    minWidth: "100px",
    render: (value: number) => (
      <span className="font-medium text-gray-900">
        {value}
      </span>
    )
  },

    { 
      key: "product_name", 
      label: "Product", 
      minWidth: "50px",
      render: (value: number) => {
        const product = products.find(p => 
          p.id === value.toString() || 
          parseInt(p.id) === value || 
          Number(p.id) === value
        );
        return (
          <span className="font-medium ">
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

  if (permissions.canEdit) {
    defaultActions.push({
      label: "Edit",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      onClick: (group: MeasurementFieldGroup) => {
        setSelectedMeasurementFieldGroup(group);
        setFormData({
          product_id: group.product_id,
          fields: group.measurement_fields.map(field => ({
            field_name: field.field_name,
            field_type: field.field_type,
            unit: field.unit,
            is_required: field.is_required 
          }))
        });
        setModalMode("edit");
        setIsModalOpen(true);
      },
    });
  }

  if (permissions.canDelete) {
    defaultActions.push({
      label: "Delete",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      onClick: (group: MeasurementFieldGroup) => {
        setGroupToDelete(group);
        setIsDeleteModalOpen(true);
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

  // New handlers for Edit and Delete from view modal
  const handleEditFromView = () => {
    if (!permissions.canEdit || !selectedMeasurementFieldGroup) return;
    
    setFormData({
      product_id: selectedMeasurementFieldGroup.product_id,
      fields: selectedMeasurementFieldGroup.measurement_fields.map(field => ({
        field_name: field.field_name,
        field_type: field.field_type,
        unit: field.unit,
        is_required: field.is_required 
      }))
    });
    setModalMode("edit");
    // Don't close the modal, just switch mode
  };

  const handleDeleteFromView = () => {
    if (!permissions.canDelete || !selectedMeasurementFieldGroup) return;
    
    // Close the view form first
    setIsModalOpen(false);
    
    // Set up the delete modal with the selected item
    setTimeout(() => {
      setGroupToDelete(selectedMeasurementFieldGroup);
      setIsDeleteModalOpen(true);
    }, 100);
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
      const product = products.find(p => 
        p.id === formData.product_id.toString() || 
        parseInt(p.id) === formData.product_id || 
        Number(p.id) === formData.product_id
      );
      const productName = product?.category_name || 'Selected Product';
      showSuccessMessage('Success!', result.message || `Measurement fields for "${productName}" have been created successfully.`);
    } else {
      showErrorMessage('Creation Failed', result.error || 'Failed to create measurement field');
    }
  };

  const handleUpdateMeasurementField = async () => {
    if (!selectedMeasurementFieldGroup) return;

    try {
      let allOperationsSuccessful = true;
      const existingFields = selectedMeasurementFieldGroup.measurement_fields;
      const formFields = formData.fields;
      
      console.log('Starting update process...');
      console.log('Existing fields:', existingFields.length);
      console.log('Form fields:', formFields.length);
      
      // Step 1: Update existing fields (matching by index)
      const minLength = Math.min(formFields.length, existingFields.length);
      
      for (let i = 0; i < minLength; i++) {
        const formField = formFields[i];
        const existingField = existingFields[i];
        
        // Check if field actually changed before updating
        const hasChanged = 
          formField.field_name !== existingField.field_name ||
          formField.field_type !== existingField.field_type ||
          formField.unit !== existingField.unit ||
          String(formField.is_required) !== String(existingField.is_required);
        
        if (hasChanged) {
          const updateData = {
            field_name: formField.field_name.trim(),
            field_type: formField.field_type,
            unit: formField.unit.trim(),
            is_required: String(formField.is_required) // Ensure it's a string
          };
          
          console.log(`Updating field ${existingField.id}:`, updateData);
          
          const result = await updateMeasurementField(existingField.id, updateData);
          
          if (!result.success) {
            console.error(`Failed to update field ${existingField.id}:`, result.error);
            allOperationsSuccessful = false;
            showErrorMessage('Update Failed', result.error || `Failed to update field "${formField.field_name}"`);
            return; // Stop execution on first error
          }
        }
      }
      
      // Step 2: Create new fields (if form has more fields than existing)
      if (formFields.length > existingFields.length && allOperationsSuccessful) {
        const newFields = formFields.slice(existingFields.length);
        
        if (newFields.length > 0) {
          console.log('Creating new fields:', newFields);
          
          const createData = {
            product_id: formData.product_id,
            fields: newFields.map(field => ({
              field_name: field.field_name.trim(),
              field_type: field.field_type,
              unit: field.unit.trim(),
              is_required: String(field.is_required)
            }))
          };
          
          const result = await createMeasurementField(createData);
          
          if (!result.success) {
            console.error('Failed to create new fields:', result.error);
            allOperationsSuccessful = false;
            showErrorMessage('Creation Failed', result.error || 'Failed to create new fields');
            return;
          }
        }
      }
      
      // Step 3: Delete removed fields (if existing has more fields than form)
      if (existingFields.length > formFields.length && allOperationsSuccessful) {
        const fieldsToDelete = existingFields.slice(formFields.length);
        
        console.log('Deleting removed fields:', fieldsToDelete);
        
        for (const fieldToDelete of fieldsToDelete) {
          const result = await deleteMeasurementField(fieldToDelete.id);
          
          if (!result.success) {
            console.error(`Failed to delete field ${fieldToDelete.id}:`, result.error);
            allOperationsSuccessful = false;
            showErrorMessage('Deletion Failed', result.error || `Failed to delete field "${fieldToDelete.field_name}"`);
            return;
          }
        }
      }
      
      // Step 4: Refresh the data and show success message
      if (allOperationsSuccessful) {
        // Refresh the measurement fields data
        const refreshResult = await fetchMeasurementFields();
        if (!refreshResult.success) {
          console.warn('Failed to refresh data after update:', refreshResult.error);
          // Still show success since the update itself worked
        }
        
        closeModal();
        const product = products.find(p => 
          p.id === formData.product_id.toString() || 
          parseInt(p.id) === formData.product_id || 
          Number(p.id) === formData.product_id
        );
        const productName = product?.category_name || 'Selected Product';
        showSuccessMessage('Success!', `Measurement fields for "${productName}" have been updated successfully.`);
      }
      
    } catch (error) {
      console.error('Unexpected error during update:', error);
      showErrorMessage('Update Failed', 'An unexpected error occurred during the update process');
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
      const product = products.find(p => 
        p.id === group.product_id.toString() || 
        parseInt(p.id) === group.product_id || 
        Number(p.id) === group.product_id
      );
      const productName = product?.category_name || 'Product';
      showSuccessMessage('Success!', `All measurement fields for "${productName}" have been deleted successfully.`);
    }
  };

  // New function to confirm deletion
  const confirmDelete = async () => {
    if (!groupToDelete) return;

    try {
      await handleDeleteAllFieldsForProduct(groupToDelete);
      setIsDeleteModalOpen(false);
      setGroupToDelete(null);
    } catch (err) {
      console.error(`Failed to delete measurement fields:`, err);
      showErrorMessage('Deletion Failed', 'Failed to delete measurement fields. Please try again.');
    }
  };

  // Helper function to get display name for delete confirmation
  const getGroupDisplayName = (group: MeasurementFieldGroup) => {
    const product = products.find(p => 
      p.id === group.product_id.toString() || 
      parseInt(p.id) === group.product_id || 
      Number(p.id) === group.product_id
    );
    return product?.category_name || `Product ID: ${group.product_id}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  if (modalMode === "create") {
    handleCreateMeasurementField();
  } else if (modalMode === "edit") {
    handleUpdateMeasurementField();
  }
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
      <main className="flex-1 p-8 bg-blue-50/50 rounded-2xl flex flex-col overflow-hidden">
        {/* Fixed Header Section */}
        <div className="flex-shrink-0 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-blue-600">{title}</h1>
            {permissions.canCreate && (
              <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
                + Add Measurement Field
              </Button>
            )}
          </div>
          {/* Search Bar */}
            <div className="flex justify-end mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
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
            </div>

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
                <h3 className="text-lg font-medium text-gray-900 mb-4">Product Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product ID <span>*</span>
                  </label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: parseInt(e.target.value) })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.product_id ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value={0}>Select Product ID</option>
                    {products.map((product) => (
                      <option key={product.id} value={parseInt(product.id)}>
                       {product.id} - {product.category_name}
                      </option>
                    ))}
                  </select>
                  {formErrors.product_id && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.product_id}</p>
                  )}
                </div>
              </div>

              {/* Measurement Fields */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Measurement Fields</h3>
                  <button
                    type="button"
                    onClick={addField}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Field
                  </button>
                </div>

                {formData.fields.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No measurement fields added yet.</p>
                    <p className="text-sm mt-1">Click "Add Field" to get started.</p>
                  </div>
                )}

                {formData.fields.map((field, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900">Field {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Field Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Field Name <span>*</span>
                        </label>
                        <input
                          type="text"
                          value={field.field_name}
                          onChange={(e) => updateField(index, { field_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., waist, hip, bust"
                          required
                        />
                      </div>

                      {/* Field Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Field Type <span>*</span>
                        </label>
                        <select
                          value={field.field_type}
                          onChange={(e) => updateField(index, { field_type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Select type...</option>
                          <option value="float">Float</option>
                          <option value="integer">Integer</option>
                          <option value="text">Text</option>
                        </select>
                      </div>

                      {/* Unit */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit <span>*</span>
                        </label>
                        <input
                          type="text"
                          value={field.unit}
                          onChange={(e) => updateField(index, { unit: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., cm, inches, kg"
                          required
                        />
                      </div>

                    </div>
                  </div>
                ))}

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

        {/* Modal for Edit */}
        {modalMode === "edit" && (
          <SlideModal isOpen={isModalOpen} onClose={closeModal} title={getModalTitle()}>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Product Selection - Read Only in Edit Mode */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Product Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product ID <span>*</span>
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                    {formData.product_id} - {(() => {
                          const productId = formData.product_id;
                          const product = products.find(p => p.id === productId.toString()) ||
                                        products.find(p => parseInt(p.id) === productId) ||
                                        products.find(p => Number(p.id) === productId);
                          return product?.category_name || 'Unknown Product';
                        })()}
                  </div>
                </div>
              </div>

              {/* Measurement Fields */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Measurement Fields</h3>
                  <button
                    type="button"
                    onClick={addField}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Field
                  </button>
                </div>

                {formData.fields.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No measurement fields added yet.</p>
                    <p className="text-sm mt-1">Click "Add Field" to get started.</p>
                  </div>
                )}

                {formData.fields.map((field, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900">Field {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Field Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Field Name <span>*</span>
                        </label>
                        <input
                          type="text"
                          value={field.field_name}
                          onChange={(e) => updateField(index, { field_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., waist, hip, bust"
                          required
                        />
                      </div>

                      {/* Field Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Field Type <span>*</span>
                        </label>
                        <select
                          value={field.field_type}
                          onChange={(e) => updateField(index, { field_type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Select type...</option>
                          <option value="float">Float</option>
                          <option value="integer">Integer</option>
                          <option value="text">Text</option>
                        </select>
                      </div>

                      {/* Unit */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit <span>*</span>
                        </label>
                        <input
                          type="text"
                          value={field.unit}
                          onChange={(e) => updateField(index, { unit: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., cm, inches, kg"
                          required
                        />
                      </div>

                    </div>
                  </div>
                ))}

                {formErrors.fields && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.fields}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Update Measurement Fields
                </Button>
              </div>
            </form>
          </SlideModal>
        )}

        {/* Modal for View - Updated with Edit and Delete buttons like ProductMeasurement */}
        {modalMode === "view" && selectedMeasurementFieldGroup && (
          <SlideModal isOpen={isModalOpen} onClose={closeModal} title={getModalTitle()}>
            <div className="flex flex-col h-full">
              {/* Content - Make it scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Product Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Product Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product ID</label>
                    <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                      {selectedMeasurementFieldGroup.product_id} - {(() => {
                        const productId = selectedMeasurementFieldGroup.product_id;
                        const product = products.find(p => p.id === productId.toString()) ||
                                      products.find(p => parseInt(p.id) === productId) ||
                                      products.find(p => Number(p.id) === productId);
                        return product?.category_name || 'Unknown Product';
                      })()}
                    </div>
                  </div>
                </div>

                {/* Measurement Fields */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Measurement Fields</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {selectedMeasurementFieldGroup.measurement_fields.length} field{selectedMeasurementFieldGroup.measurement_fields.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {selectedMeasurementFieldGroup.measurement_fields.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No measurement fields configured for this product.</p>
                    </div>
                  )}

                  {selectedMeasurementFieldGroup.measurement_fields.map((field, index) => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-900">Field {index + 1}</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Field Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Field Name
                          </label>
                          <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                            {field.field_name}
                          </div>
                        </div>

                        {/* Field Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Field Type
                          </label>
                          <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {field.field_type}
                            </span>
                          </div>
                        </div>

                        {/* Unit */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Unit
                          </label>
                          <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                            {field.unit}
                          </div>
                        </div>
                      </div>

                      {/* Timestamps - Similar to EmployeeForm bottom section */}
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-800 border-t pt-3">Audit Information</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Created At
                            </label>
                            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 text-sm">
                              {new Date(field.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Last Updated
                            </label>
                            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 text-sm">
                              {new Date(field.updated_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Action Buttons - Similar to ProductMeasurement */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 bg-white px-6 pb-6">
                {permissions.canDelete && (
                  <Button 
                    type="button"
                    onClick={handleDeleteFromView}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete
                  </Button>
                )}
                {permissions.canEdit && (
                  <Button 
                    type="button"
                    onClick={handleEditFromView}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </SlideModal>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div 
              className="fixed inset-0 bg-blue-50/70 bg-opacity-50 transition-opacity"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setGroupToDelete(null);
              }}
            />
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                &#8203;
              </span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <Trash2 className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Delete Measurement Fields
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete the measurement fields for {groupToDelete ? getGroupDisplayName(groupToDelete) : 'this product'}? This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setGroupToDelete(null);
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
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