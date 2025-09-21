// components/ProductMeasurement.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, AlertCircle, X, CheckCircle } from 'lucide-react';
import ReusableTable from '@/components/ui/ReusableTable';
import SlideModal from '@/components/ui/SlideModal';
import useProductMeasurement, { 
  ProductMeasurement, 
  CreateProductMeasurementData, 
  MeasurementField, 
  Product 
} from '@/app/hooks/useProductMeasurements';
import MeasurementView from '../ui/mesurement_view';
import Button from '../ui/button';

const SIZES = ['double_extra_small', 'extra_small', 'small', 'medium', 'large', 'extra_large', 'double_large'];

interface ProductMeasurementProps {
  permissions?: {
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canView?: boolean;
  };
}

// Message Modal Component (same as MeasurementFieldManagement)
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

const ProductMeasurementComponent: React.FC<ProductMeasurementProps> = ({
  permissions = {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canView: true
  }
}) => {
  const {
    loading,
    error,
    getProductMeasurements,
    getMeasurementFields,
    getProducts,
    createProductMeasurement,
    updateProductMeasurement,
    deleteProductMeasurement,
    getProductMeasurement
  } = useProductMeasurement();

  // State
  const [measurements, setMeasurements] = useState<ProductMeasurement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredMeasurements, setFilteredMeasurements] = useState<ProductMeasurement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Selected item
  const [selectedMeasurement, setSelectedMeasurement] = useState<ProductMeasurement | null>(null);
  
  // Message Modal State (replacing toast)
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: ''
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Filter measurements based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredMeasurements(measurements);
    } else {
      const filtered = measurements.filter(measurement =>
        measurement.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        measurement.product_id.toString().includes(searchTerm)
      );
      setFilteredMeasurements(filtered);
    }
  }, [searchTerm, measurements]);

  // Message handlers (replacing toast functions)
  const showSuccessMessage = (title: string, message: string) => {
    setMessageModal({ isOpen: true, type: 'success', title, message });
  };

  const showErrorMessage = (title: string, message: string) => {
    setMessageModal({ isOpen: true, type: 'error', title, message });
  };

  const closeMessageModal = () => {
    setMessageModal({ ...messageModal, isOpen: false });
  };

  const loadData = async () => {
    try {
      const [measurementsData, productsData] = await Promise.all([
        getProductMeasurements(),
        getProducts()
      ]);
      setMeasurements(measurementsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      showErrorMessage('Fetch Error', 'Failed to load data. Please try again.');
    }
  };

  const handleAdd = () => {
    if (!permissions.canCreate) return;
    setSelectedMeasurement(null);
    setIsAddModalOpen(true);
  };

  const handleView = (measurement: ProductMeasurement) => {
    if (!permissions.canView) return;
    setSelectedMeasurement(measurement);
    setIsViewModalOpen(true);
  };

  const handleEdit = (measurement: ProductMeasurement) => {
    if (!permissions.canEdit) return;
    setSelectedMeasurement(measurement);
    setIsEditModalOpen(true);
  };

  const handleDelete = (measurement: ProductMeasurement) => {
    if (!permissions.canDelete) return;
    setSelectedMeasurement(measurement);
    setIsDeleteModalOpen(true);
  };

  const handleEditFromView = () => {
    if (!permissions.canEdit || !selectedMeasurement) return;
    setIsViewModalOpen(false);
    setTimeout(() => {
      setIsEditModalOpen(true);
    }, 100);
  };

  const handleDeleteFromView = () => {
    if (!permissions.canDelete || !selectedMeasurement) return;
    setIsViewModalOpen(false);
    setTimeout(() => {
      setIsDeleteModalOpen(true);
    }, 100);
  };

  const confirmDelete = async () => {
    if (selectedMeasurement) {
      try {
        await deleteProductMeasurement(selectedMeasurement.product_id, selectedMeasurement.size);
        await loadData();
        setIsDeleteModalOpen(false);
        const measurementName = `${selectedMeasurement.product_name} (Size: ${selectedMeasurement.size})`;
        setSelectedMeasurement(null);
        showSuccessMessage('Success!', `Measurement for ${measurementName} deleted successfully!`);
      } catch (error) {
        console.error('Failed to delete measurement:', error);
        showErrorMessage('Deletion Failed', 'Failed to delete measurement. Please try again.');
      }
    }
  };

  const handleFormSubmit = async (data: CreateProductMeasurementData, isEdit = false) => {
    try {
      if (isEdit && selectedMeasurement) {
        await updateProductMeasurement(selectedMeasurement.id, data);
        setIsEditModalOpen(false);
        const productName = products.find(p => p.id === data.product_id)?.category_name || 'Selected Product';
        const formattedSize = data.size.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        showSuccessMessage('Success!', `Measurement for "${productName}" (Size: ${formattedSize}) has been updated successfully!`);
      } else {
        await createProductMeasurement(data);
        setIsAddModalOpen(false);
        const productName = products.find(p => p.id === data.product_id)?.category_name || 'Selected Product';
        const formattedSize = data.size.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        showSuccessMessage('Success!', `Measurement for "${productName}" (Size: ${formattedSize}) has been created successfully!`);
      }
      await loadData();
      setSelectedMeasurement(null);
    } catch (error) {
      showErrorMessage('Save Failed', 'Failed to save measurement. Please try again.');
    }
  };

  // Table configuration - filter actions based on permissions
  const columns = [
    {
      key: 'product_id',
      label: 'Product ID',
    },
    {
      key: 'product_name',
      label: 'Product Category',
    },
    {
      key: 'size',
      label: 'Size',
    }
  ];

  const getActions = () => {
    const actions = [];
    
    if (permissions.canView) {
      actions.push({
        label: 'View',
        icon: <Eye className="w-4 h-4" />,
        onClick: handleView,
        className: 'text-blue-600 hover:bg-blue-50 focus:bg-blue-50'
      });
    }
    
    if (permissions.canEdit) {
      actions.push({
        label: 'Edit',
        icon: <Edit className="w-4 h-4" />,
        onClick: handleEdit,
        className: 'text-green-600 hover:bg-green-50 focus:bg-green-50'
      });
    }
    
    if (permissions.canDelete) {
      actions.push({
        label: 'Delete',
        icon: <Trash2 className="w-4 h-4" />,
        onClick: handleDelete,
        className: 'text-red-600 hover:bg-red-50 focus:bg-red-50'
      });
    }
    
    return actions;
  };

  return (
    <div className="flex-1 py-8 px-12 bg-blue-50/40 rounded-2xl flex flex-col overflow-hidden gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Product Measurement</h1>
        {permissions.canCreate && (
          <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
            + Add Measurement 
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-start justify-between">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-1 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <ReusableTable
        data={filteredMeasurements}
        columns={columns}
        actions={getActions()}
        loading={loading}
        emptyMessage={`No product measurements found. ${permissions.canCreate ? 'Click "Add Measurement" to get started.' : ''}`}
        minColumnWidth="120px"
      />

      {/* Add Modal */}
      <SlideModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedMeasurement(null);
        }}
        title="Add Product Measurement"
      >
        <MeasurementForm
          key="add-form"
          products={products}
          onSubmit={(data) => handleFormSubmit(data)}
          onCancel={() => {
            setIsAddModalOpen(false);
            setSelectedMeasurement(null);
          }}
          getMeasurementFields={getMeasurementFields}
        />
      </SlideModal>

      {/* Edit Modal */}
      <SlideModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMeasurement(null);
        }}
        title="Edit Product Measurement"
      >
        <MeasurementForm
          key={`edit-form-${selectedMeasurement?.id}`}
          products={products}
          initialData={selectedMeasurement}
          onSubmit={(data) => handleFormSubmit(data, true)}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedMeasurement(null);
          }}
          getMeasurementFields={getMeasurementFields}
          isEdit
        />
      </SlideModal>

      {/* View Modal - Now similar to add/edit modals */}
      <SlideModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedMeasurement(null);
        }}
        title="View Product Measurement"
      >
        <MeasurementViewWrapper
          measurement={selectedMeasurement}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedMeasurement(null);
          }}
          onEdit={handleEditFromView}
          onDelete={handleDeleteFromView}
          getMeasurementFields={getMeasurementFields}
          permissions={permissions}
        />
      </SlideModal>

    {/* Delete Confirmation Modal */}
    {isDeleteModalOpen && (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div 
          className="fixed inset-0 bg-blue-50/70 bg-opacity-50 transition-opacity"
          onClick={() => {
            setIsDeleteModalOpen(false);
            setSelectedMeasurement(null);
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
                    Delete Product Measurement
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete the measurement for {selectedMeasurement?.product_name} (Size: {selectedMeasurement?.size})? This action cannot be undone.
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
                  setSelectedMeasurement(null);
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
      {/* Message Modal (replacing Toast) */}
      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={closeMessageModal}
        type={messageModal.type}
        title={messageModal.title}
        message={messageModal.message}
      />
    </div>
  );
};

// New wrapper component for the view modal content
interface MeasurementViewWrapperProps {
  measurement: ProductMeasurement | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getMeasurementFields: (productId: number) => Promise<MeasurementField[]>;
  permissions: {
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canView?: boolean;
  };
}

const MeasurementViewWrapper: React.FC<MeasurementViewWrapperProps> = ({
  measurement,
  onClose,
  onEdit,
  onDelete,
  getMeasurementFields,
  permissions
}) => {
  const [measurementFields, setMeasurementFields] = useState<MeasurementField[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  
  useEffect(() => {
    if (measurement) {
      loadMeasurementFields(measurement.product_id);
    }
  }, [measurement]);

  const loadMeasurementFields = async (productId: number) => {
    setLoadingFields(true);
    try {
      const fields = await getMeasurementFields(productId);
      setMeasurementFields(fields || []);
    } catch (error) {
      console.error('Failed to load measurement fields:', error);
      setMeasurementFields([]);
    } finally {
      setLoadingFields(false);
    }
  };

  if (!measurement) return null;

  const formatSize = (size: string) => {
    return size.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Product ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product ID *
          </label>
          <input
            type="text"
            value={`${measurement.product_id} - ${measurement.product_name}`}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
          />
        </div>

        {/* Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Size *
          </label>
          <input
            type="text"
            value={formatSize(measurement.size)}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
          />
        </div>

        {/* Loading indicator for measurement fields */}
        {loadingFields && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading measurement fields...</span>
          </div>
        )}

        {/* Measurement Fields */}
        {!loadingFields && measurementFields.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Measurements</h3>
            <div className="space-y-4">
              {measurementFields.map(field => {
                let fieldValue = '';
                
                // Handle different measurement data formats
                if (measurement.measurements) {
                  if (Array.isArray(measurement.measurements)) {
                    // Array format: [{"field_id":12,"value":"20"}, ...]
                    const measurementItem = measurement.measurements.find((m: any) => m.field_id === field.id);
                    fieldValue = measurementItem ? measurementItem.value : '';
                  } else {
                    // Object format: {"12": "20", "13": "25"}
                    fieldValue = measurement.measurements[field.id.toString()] || '';
                  }
                }
                
                return (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.field_name} ({field.unit})
                      {field.is_required === 'true' && ' *'}
                    </label>
                    <input
                      type="text"
                      value={fieldValue || 'Not specified'}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No measurement fields available */}
        {!loadingFields && measurementFields.length === 0 && (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">
              No measurement fields configured for this product
            </p>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
        {permissions.canDelete && (
          <Button 
            type="button"
            onClick={onDelete}
            className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            Delete
          </Button>
        )}
        {permissions.canEdit && (
          <Button 
            type="button"
            onClick={onEdit}
            className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Edit
          </Button>
        )}
      </div>
    </div>
  );
};

// Enhanced Measurement Form Component with Validation
interface MeasurementFormProps {
  products: Product[];
  initialData?: ProductMeasurement | null;
  onSubmit: (data: CreateProductMeasurementData) => void;
  onCancel: () => void;
  getMeasurementFields: (productId: number) => Promise<MeasurementField[]>;
  isEdit?: boolean;
}

const MeasurementForm: React.FC<MeasurementFormProps> = ({
  products,
  initialData,
  onSubmit,
  onCancel,
  getMeasurementFields,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<CreateProductMeasurementData>({
    product_id: 0,
    size: '',
    measurements: {}
  });
  
  const [measurementFields, setMeasurementFields] = useState<MeasurementField[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [measurementFieldsError, setMeasurementFieldsError] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formInitialized, setFormInitialized] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initialize form on component mount
  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        product_id: initialData.product_id,
        size: initialData.size,
        measurements: {} // Will be populated after fields load
      });
    } else {
      setFormData({
        product_id: 0,
        size: '',
        measurements: {}
      });
    }
    setFormInitialized(false);
    setMeasurementFields([]);
  }, [initialData, isEdit]);

  // Load measurement fields when product_id changes
  useEffect(() => {
    if (formData.product_id > 0) {
      loadMeasurementFields(formData.product_id);
    } else {
      setMeasurementFields([]);
      setMeasurementFieldsError('');
      setFormInitialized(false);
    }
  }, [formData.product_id]);

  // Initialize measurements when fields are loaded
  useEffect(() => {
    if (measurementFields.length > 0 && !formInitialized) {
      const newMeasurements: Record<string, any> = {};
      
      measurementFields.forEach(field => {
        const fieldKey = field.id.toString();
        
        if (isEdit && initialData?.measurements) {
          // Handle array format from API: [{"field_id":12,"value":"20"}, ...]
          if (Array.isArray(initialData.measurements)) {
            const measurementItem = initialData.measurements.find((m: any) => m.field_id === field.id);
            newMeasurements[fieldKey] = measurementItem ? measurementItem.value : '';
          } else {
            // Handle object format: {"12": "20", "13": "25"}
            newMeasurements[fieldKey] = initialData.measurements[fieldKey] || '';
          }
        } else {
          // For add mode, initialize empty
          newMeasurements[fieldKey] = '';
        }
      });
      
      setFormData(prev => ({
        ...prev,
        measurements: newMeasurements
      }));
      setFormInitialized(true);
    }
  }, [measurementFields, initialData, isEdit, formInitialized]);

  const loadMeasurementFields = async (productId: number) => {
    setLoadingFields(true);
    setMeasurementFieldsError('');
    
    try {
      const fields = await getMeasurementFields(productId);
      
      if (!fields || fields.length === 0) {
        setMeasurementFieldsError(
          'No measurement fields are configured for this product. Please contact the administrator to add measurement fields before creating measurements.'
        );
        setMeasurementFields([]);
      } else {
        setMeasurementFields(fields);
      }
    } catch (error) {
      console.error('Failed to load measurement fields:', error);
      setMeasurementFieldsError('Failed to load measurement fields for this product.');
      setMeasurementFields([]);
    } finally {
      setLoadingFields(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.product_id === 0) {
      newErrors.product_id = 'Please select a product';
    }

    if (!formData.size) {
      newErrors.size = 'Please select a size';
    }

    // Check if measurement fields are available
    if (formData.product_id > 0 && measurementFields.length === 0 && !loadingFields) {
      newErrors.general = 'Cannot create measurements: No measurement fields are configured for the selected product.';
    }

    // Validate required measurement fields
    measurementFields.forEach(field => {
      const fieldKey = field.id.toString();
      const value = formData.measurements[fieldKey];
      if (field.is_required === 'true' && (!value || value.toString().trim() === '')) {
        newErrors[fieldKey] = `${field.field_name} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProductChange = (productId: number) => {
    setFormData(prev => ({
      ...prev,
      product_id: productId,
      measurements: {} // Reset measurements when product changes
    }));
    setFormInitialized(false);
    setErrors({});
  };

  const handleMeasurementChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [fieldId]: value
      }
    }));
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: ''
      }));
    }
  };

  const canSubmit = () => {
    return !loadingFields && !submitting && formData.product_id > 0 && measurementFields.length > 0 && formInitialized;
  };

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Error Display */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-red-800 text-sm">{errors.general}</div>
            </div>
          </div>
        )}

        {/* Measurement Fields Warning */}
        {measurementFieldsError && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
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

        {/* Product Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product ID *
          </label>
          <select
            value={formData.product_id}
            onChange={(e) => handleProductChange(parseInt(e.target.value))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              errors.product_id ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isEdit}
          >
            <option value={0}>Select Product ID</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.id} - {product.category_name}
              </option>
            ))}
          </select>
          {errors.product_id && (
            <p className="mt-1 text-sm text-red-600">{errors.product_id}</p>
          )}
        </div>

        {/* Size Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Size *
          </label>
          <select
            value={formData.size}
            onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              errors.size ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isEdit}
          >
            <option value="">Select Size</option>
            {SIZES.map(size => (
              <option key={size} value={size}>
                {size.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
          {errors.size && (
            <p className="mt-1 text-sm text-red-600">{errors.size}</p>
          )}
        </div>

        {/* Loading indicator for measurement fields */}
        {loadingFields && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading measurement fields...</span>
          </div>
        )}

        {/* Measurement Fields */}
        {formData.product_id > 0 && !loadingFields && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Measurements</h3>
            
            {measurementFields.length > 0 && formInitialized ? (
              <div className="space-y-4">
                {measurementFields.map(field => {
                  const fieldKey = field.id.toString();
                  const fieldValue = formData.measurements[fieldKey] || '';
                  
                  console.log(`Rendering field ${field.field_name} (${fieldKey}):`, fieldValue);
                  
                  return (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.field_name} ({field.unit})
                        {field.is_required === 'true' && ' *'}
                      </label>
                      <input
                        type={field.field_type === 'float' ? 'number' : 'text'}
                        step={field.field_type === 'float' ? '0.01' : undefined}
                        value={fieldValue}
                        onChange={(e) => handleMeasurementChange(fieldKey, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          errors[fieldKey] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={`Enter ${field.field_name.toLowerCase()}`}
                      />
                      {errors[fieldKey] && (
                        <p className="mt-1 text-sm text-red-600">{errors[fieldKey]}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : measurementFieldsError ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">
                  Cannot add measurements without measurement fields
                </p>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">
                  Initializing form...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button 
            type="submit"
            disabled={!canSubmit()}
            className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            {submitting ? 'Processing...' : (isEdit ? 'Update' : 'Create')} Measurement
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductMeasurementComponent;