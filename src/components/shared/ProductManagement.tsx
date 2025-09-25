"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import ReusableTable from "@/components/ui/ReusableTable";
import SlideModal from "@/components/ui/SlideModal";
import { useProducts, Product } from "@/app/hooks/useProduct";
import { useCustomers, Customer } from "@/app/hooks/useCustomers";

interface ProductManagementProps {
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
    onClick: (product: Product) => void;
    className?: string;
  }>;
  requireCustomer?: boolean;
  customersEndpoint?: string;
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

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  productName,
  loading = false
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
  loading?: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-blue-50/70 bg-opacity-50 flex items-center justify-center z-60">
      <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative">
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Delete Product
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{productName}"? This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductManagement: React.FC<ProductManagementProps> = ({
  title = "Products",
  apiEndpoint,
  permissions = {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canView: true
  },
  customActions = [],
  requireCustomer = false,
  customersEndpoint
}) => {
  const {
    products,
    loading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  } = useProducts(apiEndpoint);

  // Use the existing useCustomers hook
  const {
    customers,
    loading: loadingCustomers,
    fetchCustomers
  } = useCustomers(apiEndpoint);

  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states - Updated to use separate states for each modal type
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    category_name: "",
    base_price: "",
    description: "",
    style_option: "",
    comments: "",
    customer_id: ""
  });

  // New state for customer assignment toggle
  const [assignCustomer, setAssignCustomer] = useState(false);

  // Message Modal State
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: ''
  });

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    productName: '',
    productId: '',
    isDeleting: false
  });

  // Form Validation State
  const [formErrors, setFormErrors] = useState({
    category_name: '',
    base_price: '',
    description: '',
    style_option: '',
    customer_id: ''
  });

  // Helper function to get customer display name
  const getCustomerName = (customer: Customer): string => {
    if (customer.customer_type === 'individual') {
      return customer.customer_name;
    } else {
      return customer.company_name;
    }
  };

  // Helper function to get customer name by ID for display purposes
  const getCustomerDisplayForView = (customerId: number | string | null | undefined) => {
    if (!customerId || customerId === '' || customerId === '0' || customerId === 0) {
      return 'No Customer Assigned';
    }
    
    // Convert both to numbers for comparison since customer_id in DB is Integer
    const customerIdNum = Number(customerId);
    const customer = customers.find(c => Number(c.id) === customerIdNum);
    
    if (customer) {
      return `${customer.id} - ${getCustomerName(customer)}`;
    }
    
    if (loadingCustomers) {
      return `${customerId} - Loading...`;
    }
    
    return `${customerId} - Customer Not Found`;
  };

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

  // Helper function to safely extract error message
  const extractErrorMessage = (error: any): string => {
    if (typeof error === 'string') {
      return error;
    }
    if (typeof error === 'object' && error !== null) {
      if (error.msg) {
        return error.msg;
      }
      if (error.message) {
        return error.message;
      }
      if (error.detail) {
        return error.detail;
      }
      if (Array.isArray(error)) {
        return error.map((err: any) => extractErrorMessage(err)).join(', ');
      }
      try {
        return JSON.stringify(error);
      } catch {
        return 'Unknown error occurred';
      }
    }
    return 'An unknown error occurred';
  };

  // Form validation - Updated to exclude base_price when customer toggle is on
  const validateForm = () => {
    const errors = {
      category_name: '',
      base_price: '',
      description: '',
      style_option: '',
      customer_id: ''
    };

    if (!formData.category_name.trim()) {
      errors.category_name = 'Category name is required';
    }

    // Only validate base_price when customer toggle is OFF
    if (!assignCustomer) {
      if (!formData.base_price.trim()) {
        errors.base_price = 'Base price is required';
      } else if (isNaN(parseFloat(formData.base_price)) || parseFloat(formData.base_price) <= 0) {
        errors.base_price = 'Please enter a valid price greater than 0';
      }
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.style_option.trim()) {
      errors.style_option = 'Style option is required';
    }

    if (requireCustomer && assignCustomer && !formData.customer_id.trim()) {
      errors.customer_id = 'Please select a customer';
    }

    setFormErrors(errors);
    return Object.values(errors).every(error => !error);
  };

  // Clear form errors when form data changes
  useEffect(() => {
    const hasErrors = Object.values(formErrors).some(error => error !== '');
    if (hasErrors) {
      setFormErrors({
        category_name: '',
        base_price: '',
        description: '',
        style_option: '',
        customer_id: ''
      });
    }
  }, [formData]);

  // Initial fetch
  useEffect(() => {
    fetchProducts().then(result => {
      if (!result.success) {
        const errorMessage = extractErrorMessage(result.error);
        showErrorMessage('Fetch Error', errorMessage);
      }
    });
    
    fetchCustomers("all").then(result => {
      if (!result.success) {
        showErrorMessage('Customer Fetch Error', result.error || 'Unable to load customers');
      }
    });
  }, []);

  // Filter products based on search query
  const filteredProducts = products.filter(product => {
    const searchLower = searchQuery.toLowerCase();
    return (
      product.category_name.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower) ||
      product.style_option.toLowerCase().includes(searchLower) ||
      product.base_price.toString().includes(searchQuery)
    );
  });

  // Table columns
  const columns = [
    { key: "id", label: "Product ID", width: "120px" },
    { key: "category_name", label: "Category", minWidth: "150px" },
    { key: "style_option", label: "Style Option", minWidth: "150px" },
    { 
      key: "base_price", 
      label: "Base Price", 
      width: "130px",
      render: (value: number) => (
        <span className="font-medium">
          Rs. {value?.toFixed(2) || '0.00'}
        </span>
      )
    },
    { 
      key: "description", 
      label: "Description", 
      minWidth: "200px",
      render: (value: string) => (
        <div className="max-w-xs">
          <span className="line-clamp-2 text-sm" title={value}>
            {value}
          </span>
        </div>
      )
    },
    { 
      key: "comments", 
      label: "Comments", 
      minWidth: "150px",
      render: (value: string) => (
        <div className="max-w-xs">
          <span className="line-clamp-2 text-sm text-gray-600" title={value || 'No comments'}>
            {value || '-'}
          </span>
        </div>
      )
    }
  ];

  // Helper function to set form data from product
  const setFormDataFromProduct = (product: Product) => {
    console.log('Setting form data from product:', product);
    
    // Convert customer_id to string, handling null/undefined cases
    let customerIdString = '';
    if (product.customer_id !== null && product.customer_id !== undefined) {
      customerIdString = product.customer_id.toString();
    }
    
    setFormData({
      category_name: product.category_name,
      base_price: product.base_price.toString(),
      description: product.description,
      style_option: product.style_option,
      comments: product.comments || '',
      customer_id: customerIdString
    });
    
    // Set the toggle based on whether there's a customer assigned
    const hasCustomer = product.customer_id !== null && product.customer_id !== undefined && product.customer_id !== 0;
    setAssignCustomer(hasCustomer);
    
    console.log('Form data set:', {
      customer_id: customerIdString,
      assignCustomer: hasCustomer
    });
  };

  // Handler to open delete modal from table action
  const handleDeleteClick = (product: Product) => {
    setDeleteModal({
      isOpen: true,
      productName: product.category_name,
      productId: product.id,
      isDeleting: false
    });
  };

  // Handler to confirm deletion
  const handleConfirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    
    try {
      const result = await deleteProduct(deleteModal.productId);
      if (result.success) {
        // Close both modals and clear selected product
        setDeleteModal({
          isOpen: false,
          productName: '',
          productId: '',
          isDeleting: false
        });
        setIsViewModalOpen(false);
        setSelectedProduct(null);
        
        // Show success message after a brief delay
        setTimeout(() => {
          showSuccessMessage('Success!', `Product "${deleteModal.productName}" has been deleted successfully.`);
        }, 100);
      } else {
        const errorMessage = extractErrorMessage(result.error);
        showErrorMessage('Deletion Failed', errorMessage);
        
        // Reset deleting state but keep modal open
        setDeleteModal(prev => ({ ...prev, isDeleting: false }));
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      showErrorMessage('Deletion Failed', 'Failed to delete product. Please try again.');
      
      // Reset deleting state but keep modal open
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Handler to close delete modal
  const handleCloseDeleteModal = () => {
    if (deleteModal.isDeleting) return; // Prevent closing while deleting
    
    setDeleteModal({
      isOpen: false,
      productName: '',
      productId: '',
      isDeleting: false
    });
  };

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
        onClick: (product: Product) => {
          setSelectedProduct(product);
          setFormDataFromProduct(product);
          setIsViewModalOpen(true);
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
        onClick: (product: Product) => {
          setSelectedProduct(product);
          setFormDataFromProduct(product);
          setIsEditModalOpen(true);
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
        onClick: (product: Product) => {
          handleDeleteClick(product);
        },
        className: "text-red-600 hover:bg-red-50",
      });
    }

    return [...defaultActions, ...customActions];
  };

  // New handlers for actions from view modal
  const handleEditFromView = () => {
    if (!permissions.canEdit || !selectedProduct) return;
    setIsViewModalOpen(false);
    setTimeout(() => {
      setIsEditModalOpen(true);
    }, 100);
  };

  const handleDeleteFromView = () => {
    if (!permissions.canDelete || !selectedProduct) return;
    
    setDeleteModal({
      isOpen: true,
      productName: selectedProduct.category_name,
      productId: selectedProduct.id,
      isDeleting: false
    });
  };

  // Modal handlers
  const openCreateModal = () => {
    if (!permissions.canCreate) return;
    
    setSelectedProduct(null);
    setFormData({
      category_name: "",
      base_price: "",
      description: "",
      style_option: "",
      comments: "",
      customer_id: ""
    });
    setFormErrors({
      category_name: '',
      base_price: '',
      description: '',
      style_option: '',
      customer_id: ''
    });
    setAssignCustomer(requireCustomer);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setSelectedProduct(null);
    setAssignCustomer(requireCustomer);
    setFormErrors({
      category_name: '',
      base_price: '',
      description: '',
      style_option: '',
      customer_id: ''
    });
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedProduct(null);
    setAssignCustomer(requireCustomer);
    setFormErrors({
      category_name: '',
      base_price: '',
      description: '',
      style_option: '',
      customer_id: ''
    });
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedProduct(null);
  };

  // CRUD handlers
  const handleCreateProduct = async () => {
    const productData = {
      ...formData,
      customer_id: assignCustomer ? formData.customer_id : "",
      base_price: assignCustomer ? "0" : formData.base_price
    };
    
    const result = await createProduct(productData);
    if (result.success) {
      closeCreateModal();
      showSuccessMessage('Success!', `Product "${formData.category_name}" has been created successfully.`);
    } else {
      const errorMessage = extractErrorMessage(result.error);
      showErrorMessage('Creation Failed', errorMessage);
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;
    
    const productData = {
      ...formData,
      customer_id: assignCustomer ? formData.customer_id : "",
      base_price: assignCustomer ? "0" : formData.base_price
    };
    
    const result = await updateProduct(selectedProduct.id, productData);
    if (result.success) {
      closeEditModal();
      showSuccessMessage('Success!', `Product "${formData.category_name}" has been updated successfully.`);
    } else {
      const errorMessage = extractErrorMessage(result.error);
      showErrorMessage('Update Failed', errorMessage);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    handleCreateProduct();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    handleUpdateProduct();
  };

  // Handle customer toggle change
  const handleCustomerToggle = (checked: boolean) => {
    setAssignCustomer(checked);
    if (!checked) {
      setFormData(prev => ({ ...prev, customer_id: "" }));
      setFormErrors(prev => ({ ...prev, customer_id: "" }));
    } else {
      setFormData(prev => ({ ...prev, customer_id: "", base_price: "" }));
      setFormErrors(prev => ({ ...prev, customer_id: "", base_price: "" }));
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
     <main className="flex-1 p-8 bg-blue-50/50 rounded-2xl flex flex-col overflow-hidden">
        {/* Header Section */}
        <div className="flex-shrink-0 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-blue-600">{title}</h1>
            {permissions.canCreate && (
              <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
                + Add Product
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
                placeholder="Search products..."
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
            data={filteredProducts}
            columns={columns}
            actions={getActions()}
            loading={loading}
            emptyMessage='No products found. Click "Add Product" to get started.'
          />
        </div>

        {/* Create Modal */}
        <SlideModal isOpen={isCreateModalOpen} onClose={closeCreateModal} title="Add New Product">
          <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
            {/* Customer Assignment Toggle - Only show in create/edit modes */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">
                  Assign to Customer
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Toggle to assign this product to a specific customer
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignCustomer}
                  onChange={(e) => handleCustomerToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Customer Selection for Create - Show when toggle is on */}
            {assignCustomer && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Customer {requireCustomer ? '*' : ''}
                </label>
                
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    formErrors.customer_id ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2`}
                  required={requireCustomer && assignCustomer}
                  disabled={loadingCustomers}
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.id} - {getCustomerName(customer)}
                    </option>
                  ))}
                </select>
                {formErrors.customer_id && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.customer_id}</p>
                )}
                {loadingCustomers && (
                  <p className="mt-1 text-sm text-gray-500">Loading customers...</p>
                )}
              </div>
            )}
                      
            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Category Name *</label>
              <input
                type="text"
                value={formData.category_name}
                onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.category_name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                required
                placeholder="e.g., Blazers, T-Shirts"
              />
              {formErrors.category_name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.category_name}</p>
              )}
            </div>

            {/* Base Price - Only show when customer toggle is OFF */}
            {!assignCustomer && (
              <div>
                <label className="block text-sm font-medium mb-2">Base Price *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                    Rs.
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg ${
                      formErrors.base_price ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } focus:outline-none focus:ring-2`}
                    required
                    placeholder="00.00"
                  />
                </div>
                {formErrors.base_price && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.base_price}</p>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.description ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                rows={3}
                required
                placeholder="Detailed description of the product..."
              />
              {formErrors.description && (
                <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
              )}
            </div>

            {/* Style Option */}
            <div>
              <label className="block text-sm font-medium mb-2">Style Option *</label>
              <input
                type="text"
                value={formData.style_option}
                onChange={(e) => setFormData({ ...formData, style_option: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.style_option ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                required
                placeholder="Enter style option"
              />
              {formErrors.style_option && (
                <p className="mt-1 text-sm text-red-600">{formErrors.style_option}</p>
              )}
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium mb-2">Comments</label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Additional notes or comments about the product..."
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Create Product
              </Button>
            </div>
          </form>
        </SlideModal>

        {/* Edit Modal */}
        <SlideModal isOpen={isEditModalOpen} onClose={closeEditModal} title="Edit Product">
          <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
            {/* Customer Assignment Toggle - Only show in create/edit modes */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">
                  Assign to Customer
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Toggle to assign this product to a specific customer
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignCustomer}
                  onChange={(e) => handleCustomerToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Customer Selection for Edit - Show when toggle is on */}
            {assignCustomer && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Customer {requireCustomer ? '*' : ''}
                </label>
                
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    formErrors.customer_id ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2`}
                  required={requireCustomer && assignCustomer}
                  disabled={loadingCustomers}
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.id} - {getCustomerName(customer)}
                    </option>
                  ))}
                </select>
                {formErrors.customer_id && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.customer_id}</p>
                )}
                {loadingCustomers && (
                  <p className="mt-1 text-sm text-gray-500">Loading customers...</p>
                )}
              </div>
            )}
                      
            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Category Name *</label>
              <input
                type="text"
                value={formData.category_name}
                onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.category_name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                required
                placeholder="e.g., Blazers, T-Shirts"
              />
              {formErrors.category_name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.category_name}</p>
              )}
            </div>

            {/* Base Price - Only show when customer toggle is OFF */}
            {!assignCustomer && (
              <div>
                <label className="block text-sm font-medium mb-2">Base Price *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                    Rs.
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg ${
                      formErrors.base_price ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } focus:outline-none focus:ring-2`}
                    required
                    placeholder="00.00"
                  />
                </div>
                {formErrors.base_price && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.base_price}</p>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.description ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                rows={3}
                required
                placeholder="Detailed description of the product..."
              />
              {formErrors.description && (
                <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
              )}
            </div>

            {/* Style Option */}
            <div>
              <label className="block text-sm font-medium mb-2">Style Option *</label>
              <input
                type="text"
                value={formData.style_option}
                onChange={(e) => setFormData({ ...formData, style_option: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.style_option ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                required
                placeholder="e.g., Color: Blue, Material: Cotton"
              />
              {formErrors.style_option && (
                <p className="mt-1 text-sm text-red-600">{formErrors.style_option}</p>
              )}
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium mb-2">Comments</label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Additional notes or comments about the product..."
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Update Product
              </Button>
            </div>
          </form>
        </SlideModal>

        {/* View Modal with Edit and Delete buttons */}
        <SlideModal isOpen={isViewModalOpen} onClose={closeViewModal} title="View Product">
          <div className="flex flex-col h-full">
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Customer Information Display */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Assigned Customer
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  {getCustomerDisplayForView(selectedProduct?.customer_id)}
                </div>
              </div>
                      
              {/* Category Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Category Name</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  {formData.category_name}
                </div>
              </div>

              {/* Base Price */}
              <div>
                <label className="block text-sm font-medium mb-2">Base Price</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  Rs. {parseFloat(formData.base_price || '0').toFixed(2)}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 min-h-[80px]">
                  {formData.description}
                </div>
              </div>

              {/* Style Option */}
              <div>
                <label className="block text-sm font-medium mb-2">Style Option</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  {formData.style_option}
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium mb-2">Comments</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 min-h-[80px]">
                  {formData.comments || 'No comments'}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
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

        {/* Message Modal */}
        <MessageModal
          isOpen={messageModal.isOpen}
          onClose={closeMessageModal}
          type={messageModal.type}
          title={messageModal.title}
          message={messageModal.message}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          productName={deleteModal.productName}
          loading={deleteModal.isDeleting}
        />
      </main>
    </div>
  );
};

export default ProductManagement;