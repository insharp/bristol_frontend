// components/CustomerMeasurement.tsx
"use client";
import React, { useState, useEffect } from "react";
import { User, Building, Eye, Edit, Trash2, X } from "lucide-react";
import ReusableTable from "@/components/ui/ReusableTable";
import Button from "@/components/ui/button"; // Assuming this exists
import MeasurementSlideForm from "@/components/forms/CustomerMeasurmentSlideForm";
import { useCustomerMeasurement } from "@/app/hooks/useCustomerMeasurement";
import { 
  CustomerMeasurementProps, 
  FilterType, 
  FormMode, 
  IndividualMeasurement, 
  CorporateMeasurement 
} from "@/app/types/CustomerMeasurement.types";

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
  const [corporateData, setCorporateData] = useState<CorporateMeasurement[]>([]);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('add');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Load data based on active filter
  useEffect(() => {
    loadData();
  }, [activeFilter]);

  const loadData = async () => {
    clearError();
    
    try {
      if (activeFilter === 'individual') {
        const data = await fetchIndividualMeasurements();
        setIndividualData(data);
      } else {
        const data = await fetchCorporateMeasurements();
        setCorporateData(data);
        console.log(`coprate_data:${JSON.stringify(data)}`)
      }
    } catch (err) {
      // Error is already set by the hook
      console.error(`Failed to load ${activeFilter} measurements:`, err);
    }
  };

  // Table columns configuration
  const individualColumns = [
    { key: 'customer_id', label: 'Customer ID', minWidth: '120px' },
    { key: 'customer_name', label: 'Customer Name', minWidth: '200px' },
    { key: 'product_id', label: 'Product ID', minWidth: '120px' },
    { key: 'product_name', label: 'Product Name', minWidth: '200px' }
  ];

  const corporateColumns = [
    { key: 'corporate_customer_id', label: 'Customer ID', minWidth: '180px' },
    { key: "customer_name", label: 'Customer Name', minWidth: '250px', render: (value: any) => value || 'N/A'},
    { key: 'product_id', label: 'Product ID', minWidth: '120px' },
    { key: 'product_name', label: 'Product Name', minWidth: '200px' },
    { key: 'batch_name', label: 'Batch Name', minWidth: '200px' },
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

  const handleDelete = async (row: any) => {
    const itemType = activeFilter === 'individual' ? 'individual measurement' : 'corporate measurement';
    const confirmMessage = `Are you sure you want to delete this ${itemType}?`;
    
    if (!window.confirm(confirmMessage)) return;
    
    try {
      if (activeFilter === 'individual') {
        await deleteIndividualMeasurement(row.customer_id, row.product_id);
      } else {
        await deleteCorporateMeasurement(row.id);
      }
      
      // Refresh data after successful deletion
      await loadData();
      
    } catch (err) {
      // Error is already set by the hook
      console.error(`Failed to delete ${itemType}:`, err);
    }
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setFormMode('add');
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    loadData(); // Refresh data after form submission
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    clearError(); // Clear any existing errors
  };

  return (
    <div className="space-y-6 bg-blue-50/50 p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Customer Measurement</h1>
        {add && (
          <Button onClick={handleAdd}>
            Add Measurements
          </Button>
        )}
      </div>

      {/* Filter Toggle */}
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

      {/* Data Summary */}
      {!loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {activeFilter === 'individual' ? (
                <User className="h-5 w-5 text-blue-400" />
              ) : (
                <Building className="h-5 w-5 text-blue-400" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Showing {activeFilter === 'individual' ? individualData.length : corporateData.length}{' '}
                {activeFilter} measurement{(activeFilter === 'individual' ? individualData.length : corporateData.length) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}


      {/* Reusable Table */}
      <ReusableTable
        data={activeFilter === 'individual' ? individualData : corporateData}
        columns={activeFilter === 'individual' ? individualColumns : corporateColumns}
        actions={getTableActions()}
        loading={loading}
        emptyMessage={`No ${activeFilter} measurements found. ${add ? 'Click "Add Measurements" to get started.' : ''}`}
        minColumnWidth="120px"
      />


      {/* Slide-in Form */}
      <MeasurementSlideForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        formMode={formMode}
        filterType={activeFilter}
        selectedItem={selectedItem}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default CustomerMeasurement;