// components/CustomerMeasurement.tsx
"use client";
import React, { useState, useEffect } from "react";
import { User, Building, Eye, Edit, Trash2, X } from "lucide-react";
import ReusableTable from "@/components/ui/ReusableTable";
import Button from "@/components/ui/button"; // Assuming this exists

import { useCustomerMeasurement } from "@/app/hooks/useCustomerMeasurement";
import { 
  CustomerMeasurementProps, 
  FilterType, 
  FormMode, 
  IndividualMeasurement, 
  CorporateMeasurement 
} from "@/app/types/CustomerMeasurement.types";
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
        console.log('=== DEBUGGING INDIVIDUAL DATA ===');
        console.log('Full data array:', data);
        console.log('First item:', data?.[0]);
        console.log('Available keys in first item:', data?.[0] ? Object.keys(data[0]) : 'No data');
        console.log('ID value:', data?.[0]?.id);
        console.log('================================');
        setIndividualData(data);
      } else {
        const data = await fetchCorporateMeasurements();
        setCorporateData(data);
        console.log(`corporate_data:${JSON.stringify(data)}`)
      }
    } catch (err) {
      // Error is already set by the hook
      console.error(`Failed to load ${activeFilter} measurements:`, err);
    }
  };

  // Add after loadData function (around line 70)
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

  // Updated handleDelete to open confirmation modal
  const handleDelete = (row: any) => {
    setItemToDelete(row);
    setIsDeleteModalOpen(true);
  };

  // New function to confirm deletion
  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (activeFilter === 'individual') {
        await deleteIndividualMeasurement(itemToDelete.customer_id, itemToDelete.product_id);
      } else {
        await deleteCorporateMeasurement(itemToDelete.id);
      }
      
      // Refresh data after successful deletion
      await loadData();
      setIsDeleteModalOpen(false);
      
      // Show success message
      const itemName = getItemDisplayName(itemToDelete);
      const measurementType = activeFilter === 'individual' ? 'Individual' : 'Corporate';
      showSuccessMessage('Success!', `${measurementType} measurement for ${itemName} deleted successfully!`);
      
      setItemToDelete(null);
      
    } catch (err) {
      // Error is already set by the hook
      console.error(`Failed to delete measurement:`, err);
      showErrorMessage('Deletion Failed', 'Failed to delete measurement. Please try again.');
    }
  };

  // New handlers for actions from view modal
  const handleEditFromView = () => {
    if (!edit || !selectedItem) return;
    setFormMode('edit');
    // Keep the form open, just change the mode
  };

  const handleDeleteFromView = () => {
    if (!deleteEnabled || !selectedItem) return;
    
    // Close the view form first
    setShowForm(false);
    
    // Set up the delete modal with the selected item
    setItemToDelete(selectedItem);
    setIsDeleteModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setFormMode('add');
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    loadData(); // Refresh data after form submission
    
    // Show success message based on form mode
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
    clearError(); // Clear any existing errors
  };

  // Helper function to get display name for delete confirmation
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
              placeholder={`Search `}
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

      {/* Slide-in Form with Enhanced View Mode */}
      <MeasurementSlideForm
        isOpen={showForm}
        onClose={handleFormClose}
        formMode={formMode}
        filterType={activeFilter}
        selectedItem={selectedItem}
        onSuccess={handleFormSuccess}
        // Pass the action handlers for view mode
        onEditFromView={edit ? handleEditFromView : undefined}
        onDeleteFromView={deleteEnabled ? handleDeleteFromView : undefined}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-blue-50/70 bg-opacity-50 transition-opacity"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setItemToDelete(null);
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
                      Delete {activeFilter === 'individual' ? 'Individual' : 'Corporate'} Measurement
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the measurement for {itemToDelete ? getItemDisplayName(itemToDelete) : 'this item'}? This action cannot be undone.
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
                    setItemToDelete(null);
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

      {/* Message Modal for Success/Error Messages */}
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