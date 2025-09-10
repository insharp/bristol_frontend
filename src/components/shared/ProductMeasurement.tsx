// components/ProductMeasurement.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, Plus, Search } from 'lucide-react';
import ReusableTable from '@/components/ui/ReusableTable';
import SlideModal from '@/components/ui/SlideModal';
import useProductMeasurement, { 
  ProductMeasurement, 
  CreateProductMeasurementData, 
  MeasurementField, 
  Product 
} from '@/app/hooks/useProductMeasurements';
import MeasurementView from '../ui/mesurement_view';
const SIZES = ['double_extra_small', 'extra_small', 'small', 'medium', 'large', 'extra_large', 'double_large'];

const ProductMeasurementComponent: React.FC = () => {
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
    }
  };

  const handleAdd = () => {
    setSelectedMeasurement(null);
    setIsAddModalOpen(true);
  };

  const handleView = (measurement: ProductMeasurement) => {
    setSelectedMeasurement(measurement);
    setIsViewModalOpen(true);
  };

  const handleEdit = (measurement: ProductMeasurement) => {
    setSelectedMeasurement(measurement);
    setIsEditModalOpen(true);
  };

  const handleDelete = (measurement: ProductMeasurement) => {
    setSelectedMeasurement(measurement);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
  if (selectedMeasurement) {
    try {
      await deleteProductMeasurement(selectedMeasurement.product_id, selectedMeasurement.size);
      await loadData();
      setIsDeleteModalOpen(false);
      setSelectedMeasurement(null);
    } catch (error) {
      console.error('Failed to delete measurement:', error);
    }
  }
};

  const handleFormSubmit = async (data: CreateProductMeasurementData, isEdit = false) => {
    try {
      if (isEdit && selectedMeasurement) {
        await updateProductMeasurement(selectedMeasurement.id, data);
        setIsEditModalOpen(false);
      } else {
        await createProductMeasurement(data);
        setIsAddModalOpen(false);
      }
      await loadData();
      setSelectedMeasurement(null);
    } catch (error) {
      console.error('Failed to save measurement:', error);
    }
  };

  // Table configuration
  const columns = [
    {
      key: 'product_id',
      label: 'Product ID',
     
    },
    {
      key: 'product_name',
      label: 'Product Name',
     
    },
    {
      key: 'size',
      label: 'Size',
      
    }
  ];

  const actions = [
    {
      label: 'View',
      icon: <Eye className="w-4 h-4" />,
      onClick: handleView
    },
    {
      label: 'Edit',
      icon: <Edit className="w-4 h-4" />,
      onClick: handleEdit
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDelete,
      className: 'text-red-700 hover:bg-red-50 focus:bg-red-50'
    }
  ];

  return (
    <div className="flex-1 py-8 px-12  bg-blue-50/40 rounded-2xl flex flex-col overflow-hidden gap-4">
      {/* Header */}
      <div className="flex justify-between items-center ">
        <h1 className="text-2xl font-bold text-gray-900">Product Measurements</h1>
        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Measurement
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by product name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Table */}
      <ReusableTable
        data={filteredMeasurements}
        columns={columns}
        actions={actions}
        loading={loading}
        emptyMessage="No product measurements found."
      />

      {/* Add Modal */}
      <SlideModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Product Measurement"
      >
        <MeasurementForm
          products={products}
          onSubmit={(data) => handleFormSubmit(data)}
          onCancel={() => setIsAddModalOpen(false)}
          getMeasurementFields={getMeasurementFields}
        />
      </SlideModal>

      {/* Edit Modal */}
      <SlideModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Product Measurement"
      >
        <MeasurementForm
          products={products}
          initialData={selectedMeasurement}
          onSubmit={(data) => handleFormSubmit(data, true)}
          onCancel={() => setIsEditModalOpen(false)}
          getMeasurementFields={getMeasurementFields}
          isEdit
        />
      </SlideModal>

      {/* View Modal */}
      <SlideModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="View Product Measurement"
      >
        {selectedMeasurement && (
          <MeasurementView 
            measurement={selectedMeasurement}
            onClose={() => setIsViewModalOpen(false)}
            getMeasurementFields={getMeasurementFields}
          />
        )}
      </SlideModal>

      {/* Delete Confirmation Modal */}
     {/* Delete Confirmation Modal */}
{isDeleteModalOpen && (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div 
      className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
      onClick={() => setIsDeleteModalOpen(false)}
    />
    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      {/* This element is to trick the browser into centering the modal contents. */}
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
    </div>
  );
};

// Measurement Form Component
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
    product_id: initialData?.product_id || 0,
    size: initialData?.size || '',
    measurements: initialData?.measurements || {}
  });
  
  const [measurementFields, setMeasurementFields] = useState<MeasurementField[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load measurement fields when product changes
  useEffect(() => {
    if (formData.product_id > 0) {
      loadMeasurementFields();
    } else {
      setMeasurementFields([]);
    }
  }, [formData.product_id]);

  const loadMeasurementFields = async () => {
    setLoadingFields(true);
    try {
      const fields = await getMeasurementFields(formData.product_id);
      console.log(fields);
      setMeasurementFields(fields);
      
      // Initialize measurements object with empty values for new fields
      if (!isEdit || Object.keys(formData.measurements).length === 0) {
        const initialMeasurements: Record<string, any> = {};
        
        // Check if fields is an array before using forEach
        if (Array.isArray(fields)) {
          // Use field.id as key instead of field.field_name
          fields.forEach(field => {
            initialMeasurements[field.id.toString()] = '';
          });
          setFormData(prev => ({ ...prev, measurements: initialMeasurements }));
        } else {
          console.error('Expected array but got:', typeof fields, fields);
        }
      }
    } catch (error) {
      console.error('Failed to load measurement fields:', error);
    }
    setLoadingFields(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.product_id === 0) {
      newErrors.product_id = 'Please select a product';
    }

    if (!formData.size) {
      newErrors.size = 'Please select a size';
    }

    measurementFields.forEach(field => {
      const fieldKey = field.id.toString();
      if (field.is_required === 'true' && !formData.measurements[fieldKey]) {
        newErrors[fieldKey] = `${field.field_name} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
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

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product *
          </label>
          <select
            value={formData.product_id}
            onChange={(e) => setFormData(prev => ({ ...prev, product_id: parseInt(e.target.value) }))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              errors.product_id ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isEdit}
          >
            <option value={0}>Select Product</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.id} - {product.name}
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
          >
            <option value="">Select Size</option>
            {SIZES.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          {errors.size && (
            <p className="mt-1 text-sm text-red-600">{errors.size}</p>
          )}
        </div>

        {/* Measurement Fields */}
        {loadingFields ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          measurementFields.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Measurements</h3>
              <div className="space-y-4">
                {measurementFields.map(field => {
                  const fieldKey = field.id.toString();
                  return (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.field_name} ({field.unit}) {field.is_required === 'true' && '*'}
                      </label>
                      <input
                        type={field.field_type === 'float' ? 'number' : 'text'}
                        step={field.field_type === 'float' ? '0.01' : undefined}
                        value={formData.measurements[fieldKey] || ''}
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
            </div>
          )
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {isEdit ? 'Update' : 'Create'} Measurement
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// // Measurement View Component
// interface MeasurementViewProps {
//   measurement: ProductMeasurement;
//   onClose: () => void;
//   getMeasurementFields: (productId: number) => Promise<MeasurementField[]>;
// }

// const MeasurementView: React.FC<MeasurementViewProps> = ({ 
//   measurement, 
//   onClose, 
//   getMeasurementFields 
// }) => {
//   const [measurementFields, setMeasurementFields] = useState<MeasurementField[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadMeasurementFields();
//   }, [measurement.product_id]);

//   const loadMeasurementFields = async () => {
//     try {
//       const fields = await getMeasurementFields(measurement.product_id);
//       setMeasurementFields(fields);
//     } catch (error) {
//       console.error('Failed to load measurement fields:', error);
//     }
//     setLoading(false);
//   };

//   // Create a map of field ID to field info for easier lookup
//   const fieldMap = measurementFields.reduce((acc, field) => {
//     acc[field.id] = field;
//     return acc;
//   }, {} as Record<number, MeasurementField>);

//   return (
//     <div className="p-6">
//       <div className="space-y-6">
//         {/* Basic Info */}
//         <div className="grid grid-cols-1 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-500">Product ID</label>
//             <p className="mt-1 text-lg text-gray-900">{measurement.product_id}</p>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-500">Product Name</label>
//             <p className="mt-1 text-lg text-gray-900">{measurement.product_name}</p>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-500">Size</label>
//             <p className="mt-1 text-lg text-gray-900">{measurement.size}</p>
//           </div>
//         </div>

//         {/* Measurements */}
//         <div>
//           <h3 className="text-lg font-medium text-gray-900 mb-4">Measurements</h3>
//           {loading ? (
//             <div className="flex justify-center py-4">
//               <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
//             </div>
//           ) : (
//             <div className="space-y-3">
//               {Object.entries(measurement.measurements).map(([fieldId, value]) => {
//                 const field = fieldMap[parseInt(fieldId)];
//                 const displayName = field ? `${field.field_name} (${field.unit})` : `Field ID: ${fieldId}`;
                
//                 return (
//                   <div key={fieldId} className="flex justify-between items-center py-2 border-b border-gray-100">
//                     <span className="text-sm font-medium text-gray-700">{displayName}</span>
//                     <span className="text-sm text-gray-900">{value}</span>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>

//         {/* Timestamps */}
//         <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
//           <p>Created: {new Date(measurement.created_at).toLocaleString()}</p>
//           <p>Updated: {new Date(measurement.updated_at).toLocaleString()}</p>
//         </div>

//         {/* Close Button */}
//         <div className="pt-4">
//           <button
//             onClick={onClose}
//             className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

export default ProductMeasurementComponent;