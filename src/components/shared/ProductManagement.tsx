"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import ReusableTable from "@/components/ui/ReusableTable";
import SlideModal from "@/components/ui/SlideModal";
import { useProducts, Product } from "@/app/hooks/useProduct";

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

const ProductManagement: React.FC<ProductManagementProps> = ({
  title = "Products",
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
    products,
    loading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  } = useProducts(apiEndpoint);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    category_name: "",
    base_price: "",
    description: "",
    style_option: "",
    comments: ""
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
    category_name: '',
    base_price: '',
    description: '',
    style_option: ''
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
      category_name: '',
      base_price: '',
      description: '',
      style_option: ''
    };

    if (!formData.category_name.trim()) {
      errors.category_name = 'Category name is required';
    }

    if (!formData.base_price.trim()) {
      errors.base_price = 'Base price is required';
    } else if (isNaN(parseFloat(formData.base_price)) || parseFloat(formData.base_price) <= 0) {
      errors.base_price = 'Please enter a valid price greater than 0';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.style_option.trim()) {
      errors.style_option = 'Style option is required';
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
        style_option: ''
      });
    }
  }, [formData]);

  // Initial fetch
  useEffect(() => {
    fetchProducts().then(result => {
      if (!result.success) {
        showErrorMessage('Fetch Error', result.error || 'Failed to load products');
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
      width: "120px",
      render: (value: number) => (
        <span className="font-medium text-green-600">
          ${value.toFixed(2)}
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
    setFormData({
      category_name: product.category_name,
      base_price: product.base_price.toString(),
      description: product.description,
      style_option: product.style_option,
      comments: product.comments || ''
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
        onClick: (product: Product) => {
          setSelectedProduct(product);
          setFormDataFromProduct(product);
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
        onClick: (product: Product) => {
          if (window.confirm(`Are you sure you want to delete product "${product.category_name}"?`)) {
            handleDeleteProduct(product.id);
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
    
    setSelectedProduct(null);
    setFormData({
      category_name: "",
      base_price: "",
      description: "",
      style_option: "",
      comments: ""
    });
    setFormErrors({
      category_name: '',
      base_price: '',
      description: '',
      style_option: ''
    });
    setModalMode("create");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setFormErrors({
      category_name: '',
      base_price: '',
      description: '',
      style_option: ''
    });
  };


  // CRUD handlers
  const handleCreateProduct = async () => {
    const result = await createProduct(formData);
    if (result.success) {
      closeModal();
      showSuccessMessage('Success!', `Product "${formData.category_name}" has been created successfully.`);
    } else {
      showErrorMessage('Creation Failed', result.error || 'Failed to create product');
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;
    const result = await updateProduct(selectedProduct.id, formData);
    if (result.success) {
      closeModal();
      showSuccessMessage('Success!', `Product "${formData.category_name}" has been updated successfully.`);
    } else {
      showErrorMessage('Update Failed', result.error || 'Failed to update product');
    }
  };


  const handleDeleteProduct = async (productId: string) => {
    const productToDelete = products.find(p => p.id === productId);
    const result = await deleteProduct(productId);
    if (result.success) {
      const name = productToDelete ? productToDelete.category_name : 'Product';
      showSuccessMessage('Success!', `Product "${name}" has been deleted successfully.`);
    } else {
      showErrorMessage('Deletion Failed', result.error || 'Failed to delete product');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (modalMode === "create") {
      handleCreateProduct();
    } else if (modalMode === "edit") {
      handleUpdateProduct();
    }
  };

  const getModalTitle = () => {
    switch (modalMode) {
      case "create": return "Add New Product";
      case "edit": return "Edit Product";
      case "view": return "View Product";
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
                + Add Product
              </Button>
            )}
          </div>

          {/* Search Section */}
          <div className="mb-6">
            <div className="relative max-w-md">
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
          </div>
        </div>

        {/* Flexible Table Container */}
        <div className="flex-1 min-h-0">
          <ReusableTable
            data={filteredProducts}
            columns={columns}
            actions={getActions()}
            loading={loading}
            emptyMessage="No products found."
          />
        </div>


        <SlideModal isOpen={isModalOpen} onClose={closeModal} title={getModalTitle()}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                readOnly={modalMode === "view"}
                required
                placeholder="e.g., Blazzers,T-Shirts"
              />
              {formErrors.category_name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.category_name}</p>
              )}
            </div>

            {/* Base Price */}
            <div>
              <label className="block text-sm font-medium mb-2">Base Price *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  className={`w-full pl-7 pr-3 py-2 border rounded-lg ${
                    formErrors.base_price ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2`}
                  readOnly={modalMode === "view"}
                  required
                  placeholder="0.00"
                />
              </div>
              {formErrors.base_price && (
                <p className="mt-1 text-sm text-red-600">{formErrors.base_price}</p>
              )}
            </div>

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
                readOnly={modalMode === "view"}
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
                readOnly={modalMode === "view"}
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
                readOnly={modalMode === "view"}
                placeholder="Additional notes or comments about the product..."
              />
            </div>

            {modalMode !== "view" && (
              <div className="flex justify-end pt-4">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {modalMode === "create" ? "Create Product" : "Update Product"}
                </Button>

              </div>
            )}
          </form>
        </SlideModal>

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

export default ProductManagement;