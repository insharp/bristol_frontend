// components/CustomerMeasurement.tsx
"use client";
import React, { useState, useEffect } from "react";
import { User, Building, Eye, Edit, Trash2, X } from "lucide-react";
import ReusableTable from "@/components/ui/ReusableTable";
import Button from "@/components/ui/button";

import { useCustomerMeasurement } from "@/hooks/useCustomerMeasurement";
import { 
  CustomerMeasurementProps, 
  FilterType, 
  FormMode, 
  IndividualMeasurement, 
  CorporateMeasurement 
} from "@/types/CustomerMeasurement.types";
import MeasurementSlideForm from "../forms/CustomerMeasurmentSlideForm";

const CustomerMeasurement: React.FC<CustomerMeasurementProps> = ({
  view = true,
  edit = true,
  delete: deleteEnabled = true,
  add = true
}) => {
  // Custom hooks
  const {
    loading,
    error,
    clearError,
    fetchIndividualMeasurements,
    deleteIndividualMeasurement,
    fetchCorporateMeasurements,
    deleteCorporateMeasurement,
  } = useCustomerMeasurement();

  // State management
  const [activeFilter, setActiveFilter] = useState<FilterType>('individual');
  const [individualData, setIndividualData] = useState<IndividualMeasurement[]>([]);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [corporateData, setCorporateData] = useState<CorporateMeasurement[]>([]);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('add');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // Message Modal State for success/error messages
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: ''
  });

  // Load data based on active filter
  useEffect(() => {
    loadData();
  }, [activeFilter]);

  // Message handlers for success/error messages
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
    clearError();
    
    try {
      if (activeFilter === 'individual') {
        const data = await fetchIndividualMeasurements();
        setIndividualData(data);
      } else {
        const data = await fetchCorporateMeasurements();
        setCorporateData(data);
      }
    } catch (err) {
      console.error(`Failed to load ${activeFilter} measurements:`, err);
    }
  };

  const getFilteredData = () => {
    const data = activeFilter === 'individual' ? individualData : corporateData;
    
    if (!searchQuery) {
      return data;
    }
    
    const searchLower = searchQuery.toLowerCase();
    
    return data.filter(item => {
      if (activeFilter === 'individual') {
        const individualItem = item as IndividualMeasurement;
        return (
          individualItem.customer_name?.toLowerCase().includes(searchLower) ||
          individualItem.product_name?.toLowerCase().includes(searchLower) ||
          individualItem.customer_id?.toString().includes(searchQuery) ||
          individualItem.product_id?.toString().includes(searchQuery) ||
          individualItem.id?.toString().includes(searchQuery)
        );
      } else {
        const corporateItem = item as CorporateMeasurement;
        return (
          corporateItem.customer_name?.toLowerCase().includes(searchLower) ||
          corporateItem.product_name?.toLowerCase().includes(searchLower) ||
          corporateItem.batch_name?.toLowerCase().includes(searchLower) ||
          corporateItem.corporate_customer_id?.toString().includes(searchQuery) ||
          corporateItem.product_id?.toString().includes(searchQuery) ||
          corporateItem.id?.toString().includes(searchQuery)
        );
      }
    });
  };

  // Table columns configuration
  const individualColumns = [
    { 
      key: 'id', 
      label: 'Measurement ID', 
      minWidth: '140px'
    },
    { key: 'customer_id', label: 'Customer ID', minWidth: '120px' },
    { key: 'customer_name', label: 'Customer Name', minWidth: '200px' },
    { key: 'product_id', label: 'Product ID', minWidth: '120px' },
    { key: 'product_name', label: 'Product Name', minWidth: '200px' }
  ];

  const corporateColumns = [
    { 
      key: 'bulk_id', 
      label: 'Bulk ID', 
      minWidth: '120px', 
      render: (value: any, row: any) => {
        return row.id || 'Not Available';
      }
    },
    { key: 'corporate_customer_id', label: 'Customer ID', minWidth: '140px' },
    { key: "customer_name", label: 'Customer Name', minWidth: '200px', render: (value: any) => value || 'N/A'},
    { key: 'product_id', label: 'Product ID', minWidth: '120px' },
    { key: 'product_name', label: 'Product Name', minWidth: '180px' },
    { key: 'batch_name', label: 'Batch Name', minWidth: '150px' },
    { key: 'total_employees', label: 'No. of Employees', minWidth: '150px' }
  ];

  // Generate table actions based on props
  const getTableActions = () => {
    const actions = [];
    
    if (view) {
      actions.push({
        label: 'View',
        icon: <Eye className="w-4 h-4" />,
        onClick: (row: any) => handleView(row),
        className: 'text-blue-600 hover:bg-blue-50 focus:bg-blue-50'
      });
    }
    
    if (edit) {
      actions.push({
        label: 'Edit',
        icon: <Edit className="w-4 h-4" />,
        onClick: (row: any) => handleEdit(row),
        className: 'text-green-600 hover:bg-green-50 focus:bg-green-50'
      });
    }
    
    if (deleteEnabled) {
      actions.push({
        label: 'Delete',
        icon: <Trash2 className="w-4 h-4" />,
        onClick: (row: any) => handleDelete(row),
        className: 'text-red-600 hover:bg-red-50 focus:bg-red-50'
      });
    }
    
    return actions;
  };

  // Action handlers
  const handleView = (row: any) => {
    setSelectedItem(row);
    setFormMode('view');
    setShowForm(true);
  };

  const handleEdit = (row: any) => {
    setSelectedItem(row);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleDelete = (row: any) => {
    setItemToDelete(row);
    setIsDeleteModalOpen(true);
  };

  //confirmDelete with comprehensive error handling
  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (activeFilter === 'individual') {
        await deleteIndividualMeasurement(itemToDelete.customer_id, itemToDelete.product_id);
      } else {
        await deleteCorporateMeasurement(itemToDelete.id);
      }
      
      await loadData();
      
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      setShowForm(false);
      setSelectedItem(null);
      
      const itemName = getItemDisplayName(itemToDelete);
      const measurementType = activeFilter === 'individual' ? 'Individual' : 'Corporate';
      setTimeout(() => {
        showSuccessMessage('Success!', `${measurementType} measurement for ${itemName} deleted successfully!`);
      }, 100);
      
    } catch (error: any) {
      console.error('Delete error:', error);
      
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      
      const itemName = getItemDisplayName(itemToDelete);
      const measurementType = activeFilter === 'individual' ? 'individual' : 'corporate';
      
      // Handle constraint errors (either from our hook transformation or original "Failed to fetch")
      if ((error instanceof TypeError && error.message === 'Failed to fetch') || 
          error.isConstraintError || 
          (error.message && error.message.includes('Foreign key constraint violation'))) {
        setTimeout(() => {
          showErrorMessage(
            'Cannot Delete Measurement',
            `Cannot delete the ${measurementType} measurement for "${itemName}" because there are existing orders for it. Please cancel or delete these records first before deleting the measurement.`
          );
        }, 100);
        return;
      }

    // Handle other potential errors
    let errorTitle = 'Delete Failed';
    let errorMessage = `Failed to delete the ${measurementType} measurement for "${itemName}".`;
    
    if (error.response?.status) {
      const status = error.response.status;
      
      if (status === 409 || status === 400) {
        errorTitle = 'Cannot Delete Measurement';
        errorMessage = `Cannot delete the ${measurementType} measurement for "${itemName}" because there are existing orders for it. Please cancel or delete these records first before deleting the measurement.`;
      } else if (status === 404) {
        errorTitle = 'Not Found';
        errorMessage = `The ${measurementType} measurement for "${itemName}" was not found. It may have already been deleted.`;
      } else if (status === 403) {
        errorTitle = 'Access Denied';
        errorMessage = `You don't have permission to delete this ${measurementType} measurement.`;
      } else if (status >= 500) {
        errorTitle = 'Server Error';
        errorMessage = 'A server error occurred while trying to delete the measurement. Please try again later.';
      }
    }
    // Check for specific error messages from the API
    else if (error.response?.data?.message || error.response?.data?.detail) {
      const apiMessage = (error.response.data.message || error.response.data.detail).toLowerCase();
      
      if (apiMessage.includes('foreign key') || apiMessage.includes('constraint') || apiMessage.includes('referenced')) {
        errorTitle = 'Cannot Delete Measurement';
        errorMessage = `Cannot delete the ${measurementType} measurement for "${itemName}" because there are existing orders or appointments associated with this measurement. Please delete the related orders first, then try again.`;
      } else {
        errorMessage = error.response.data.message || error.response.data.detail;
      }
    }
    
    setTimeout(() => {
      showErrorMessage(errorTitle, errorMessage);
    }, 100);
  }
};

  const handleEditFromView = () => {
    if (!edit || !selectedItem) return;
    setFormMode('edit');
  };

  const handleDeleteFromView = () => {
    if (!deleteEnabled || !selectedItem) return;
    setItemToDelete(selectedItem);
    setIsDeleteModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setFormMode('add');
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    loadData();
    
    if (formMode === 'add') {
      const measurementType = activeFilter === 'individual' ? 'Individual' : 'Corporate';
      showSuccessMessage('Success!', `${measurementType} measurement has been created successfully!`);
    } else if (formMode === 'edit' && selectedItem) {
      const measurementType = activeFilter === 'individual' ? 'Individual' : 'Corporate';
      const itemName = getItemDisplayName(selectedItem);
      showSuccessMessage('Success!', `${measurementType} measurement for ${itemName} has been updated successfully!`);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedItem(null);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setSearchQuery("");
    clearError();
  };

  const getItemDisplayName = (item: any) => {
    if (activeFilter === 'individual') {
      return item.customer_name || `Customer ID: ${item.customer_id}`;
    } else {
      return item.customer_name || `Corporate Customer ID: ${item.corporate_customer_id}`;
    }
  };

  return (
    <div className="space-y-6 bg-blue-50/50 rounded-2xl p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-blue-600">Customer Measurement</h1>
        {add && (
          <Button onClick={handleAdd}>
            + Add Measurement
          </Button>
        )}
      </div>

      {/* Filter Toggle and Search Bar */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => handleFilterChange('individual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeFilter === 'individual'
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <User className="w-4 h-4" />
            Individual
          </button>
          <button
            onClick={() => handleFilterChange('corporate')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeFilter === 'corporate'
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Building className="w-4 h-4" />
            Corporate
          </button>
        </div>

        {/* Search Bar */}
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

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-start justify-between">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-1 text-sm text-red-700">{error}</div>
              </div>
            </div>
            <button
              onClick={() => clearError()}
              className="ml-4 text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Reusable Table */}
      <ReusableTable
        data={getFilteredData()} 
        columns={activeFilter === 'individual' ? individualColumns : corporateColumns}
        actions={getTableActions()}
        loading={loading}
        emptyMessage={`No ${activeFilter} measurements found. ${add ? 'Click "Add Measurements" to get started.' : ''}`}
        minColumnWidth="120px"
      />

      {/* Slide-in Form */}
      <MeasurementSlideForm
        isOpen={showForm}
        onClose={handleFormClose}
        formMode={formMode}
        filterType={activeFilter}
        selectedItem={selectedItem}
        onSuccess={handleFormSuccess}
        onEditFromView={edit ? handleEditFromView : undefined}
        onDeleteFromView={deleteEnabled ? handleDeleteFromView : undefined}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-blue-50/70 bg-opacity-50 flex items-center justify-center z-[10000]">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete {activeFilter === 'individual' ? 'Individual' : 'Corporate'} Measurement
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the measurement for {itemToDelete ? getItemDisplayName(itemToDelete) : 'this item'}? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setItemToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messageModal.isOpen && (
        <div className="fixed inset-0 bg-blue-50/70 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                {messageModal.type === 'success' ? (
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
                <h3 className="text-lg font-semibold text-gray-900">{messageModal.title}</h3>
              </div>
              <p className="text-gray-600 mb-6">{messageModal.message}</p>
              <div className="flex justify-end">
                <Button
                  onClick={closeMessageModal}
                  className={`${
                    messageModal.type === 'success' 
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
      )}
    </div>
  );
};

export default CustomerMeasurement;