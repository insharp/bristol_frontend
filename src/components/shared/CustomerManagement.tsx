"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import ReusableTable from "@/components/ui/ReusableTable";
import { useCustomers, Customer, CustomerType } from "@/app/hooks/useCustomers";
import MessageModal from "@/components/ui/ErrorMessageModal"
import CustomerTypeFilter from "@/components/Filter/CustomerTypeFilter";
import SlideModal from "@/components/ui/SlideModal";


interface CustomerManagementProps {
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
    onClick: (customer: Customer) => void;
    className?: string;
  }>;
}

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  customerInfo,
  loading = false
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  customerInfo: { name: string; type: string; id: string };
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
                Delete Customer
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete the {customerInfo.type} customer "{customerInfo.name}"? This action cannot be undone.
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
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:mr-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const CustomerManagement: React.FC<CustomerManagementProps> = ({
  title = "Customers",
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
    customers,
    loading,
    selectedType,
    setSelectedType,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
  } = useCustomers(apiEndpoint);

  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    customer_type: "individual" as "individual" | "corporate",
    email: "",
    phone_number: "",
    special_notes: "",
    customer_name: "",
    company_name: "",
    contact_person: "",
    delivery_address: ""
  });

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
    customerId: '',
    customerInfo: {
      name: '',
      type: '',
      id: ''
    },
    isDeleting: false
  });

  // Form Validation State
  const [formErrors, setFormErrors] = useState({
    email: '',
    phone_number: '',
    customer_name: '',
    company_name: '',
    contact_person: '',
    delivery_address: ''
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

  // Helper function to format customer info for delete modal
  const getCustomerInfo = (customer: Customer) => {
    const name = customer.customer_type === 'individual' 
      ? (customer as any).customer_name 
      : (customer as any).company_name;
    const type = customer.customer_type === 'individual' ? 'Individual' : 'Corporate';
    
    return {
      name: name || `Customer ${customer.id}`,
      type,
      id: customer.id
    };
  };

  // Handler to open delete modal from table action
  const handleDeleteClick = (customer: Customer) => {
    const customerInfo = getCustomerInfo(customer);
    setDeleteModal({
      isOpen: true,
      customerId: customer.id,
      customerInfo,
      isDeleting: false
    });
  };

  // Handler to open delete modal from view modal
  const handleDeleteFromView = () => {
    if (!permissions.canDelete || !selectedCustomer) return;
    
    const customerInfo = getCustomerInfo(selectedCustomer);
    setDeleteModal({
      isOpen: true,
      customerId: selectedCustomer.id,
      customerInfo,
      isDeleting: false
    });
  };

  // Handler to switch from view to edit mode (like AppointmentManagement)
  const handleEditFromView = () => {
    if (!permissions.canEdit || !selectedCustomer) return;
    
    console.log('Navigating from view to edit modal');
    setIsFormOpen(false);
    setTimeout(() => {
      setModalMode("edit");
      setIsFormOpen(true);
    }, 100);
  };

  // Handler to confirm deletion
  const handleConfirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    
    try {
      const result = await deleteCustomer(deleteModal.customerId);
      if (result.success) {
        // Close both modals and clear selected customer
        setDeleteModal({
          isOpen: false,
          customerId: '',
          customerInfo: {
            name: '',
            type: '',
            id: ''
          },
          isDeleting: false
        });
        setIsFormOpen(false);
        setSelectedCustomer(null);
        
        // Show success message after a brief delay
        setTimeout(() => {
          showSuccessMessage('Success!', `Customer "${deleteModal.customerInfo.name}" has been deleted successfully.`);
        }, 100);
      } else {
        showErrorMessage('Deletion Failed', result.error || 'Failed to delete customer');
        
        // Reset deleting state but keep modal open
        setDeleteModal(prev => ({ ...prev, isDeleting: false }));
      }
    } catch (error) {
      console.error('Failed to delete customer:', error);
      showErrorMessage('Deletion Failed', 'Failed to delete customer. Please try again.');
      
      // Reset deleting state but keep modal open
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Handler to close delete modal
  const handleCloseDeleteModal = () => {
    if (deleteModal.isDeleting) return; // Prevent closing while deleting
    
    setDeleteModal({
      isOpen: false,
      customerId: '',
      customerInfo: {
        name: '',
        type: '',
        id: ''
      },
      isDeleting: false
    });
  };

  // Validation logic
  const validateForm = () => {
    const errors = {
      email: '',
      phone_number: '',
      customer_name: '',
      company_name: '',
      contact_person: '',
      delivery_address: ''
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.phone_number.trim()) {
      errors.phone_number = 'Phone number is required';
    } else if (formData.phone_number.trim().length < 10) {
      errors.phone_number = 'Phone number must be at least 10 digits';
    }

    if (formData.customer_type === 'individual') {
      if (!formData.customer_name.trim()) {
        errors.customer_name = 'Customer name is required';
      }
      // Delivery address is optional for individual customers
    } else if (formData.customer_type === 'corporate') {
      if (!formData.company_name.trim()) {
        errors.company_name = 'Company name is required';
      }
      if (!formData.contact_person.trim()) {
        errors.contact_person = 'Contact person is required';
      }
      if (!formData.delivery_address.trim()) {
        errors.delivery_address = 'Delivery address is required';
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
        email: '',
        phone_number: '',
        customer_name: '',
        company_name: '',
        contact_person: '',
        delivery_address: ''
      });
    }
  }, [formData]);

  // Initial fetch
  useEffect(() => {
    fetchCustomers().then(result => {
      if (!result.success) {
        showErrorMessage('Fetch Error', result.error || 'Failed to load customers');
      }
    });
  }, []);

  // Fetch when type changes
  useEffect(() => {
    fetchCustomers(selectedType).then(result => {
      if (!result.success) {
        showErrorMessage('Fetch Error', result.error || 'Failed to load customers');
      }
    });
  }, [selectedType]);

  // Filter customers based on search query
  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchQuery.toLowerCase();
    const emailMatch = customer.email.toLowerCase().includes(searchLower);
    const phoneMatch = customer.phone_number.includes(searchQuery);
    
    let nameMatch = false;
    if (customer.customer_type === 'individual') {
      nameMatch = (customer as any).customer_name.toLowerCase().includes(searchLower);
    } else {
      const corp = customer as any;
      nameMatch = corp.company_name.toLowerCase().includes(searchLower) ||
                  corp.contact_person.toLowerCase().includes(searchLower);
    }
    return emailMatch || phoneMatch || nameMatch;
  });

  // Get customer count for each type
  const getCustomerCount = (type: CustomerType) => {
    if (type === "all") return customers.length;
    return customers.filter(customer => customer.customer_type === type).length;
  };

  //  Dynamic table columns - Show delivery address for ALL customer types
  const getColumns = () => {
    const baseColumns: Array<{
      key: string;
      label: string;
      render?: (value: any, row: any) => React.ReactNode;
      width?: string;
      minWidth?: string;
    }> = [
      { key: "id", label: "Customer ID", width: "120px" },
    ];

    if (selectedType === "individual" || selectedType === "all") {
      baseColumns.push({ key: "customer_name", label: "Customer Name", minWidth: "150px" });
    }
    
    if (selectedType === "corporate" || selectedType === "all") {
      baseColumns.push(
        { key: "company_name", label: "Company Name", minWidth: "180px" },
        { key: "contact_person", label: "Contact Person", minWidth: "150px" }
      );
    }

    baseColumns.push(
      { key: "email", label: "Email" },
      { key: "phone_number", label: "Phone Number"},
      {
        key: "customer_type",
        label: "Type",
        render: (value: any) => {
          const typeColors: Record<string, string> = {
            individual: "bg-blue-100 text-blue-800",
            corporate: "bg-purple-100 text-purple-800"
          };
          const typeLabels: Record<string, string> = {
            individual: "Individual",
            corporate: "Corporate"
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[value] || "bg-gray-100 text-gray-800"}`}>
              {typeLabels[value] || value}
            </span>
          );
        },
      },
      // Show delivery address for ALL customer types
      { 
        key: "delivery_address", 
        label: "Delivery Address",
        render: (value: any) => value || "Not provided"
      }
    );

    return baseColumns;
  };

  // Helper function to set form data from customer
  const setFormDataFromCustomer = (customer: Customer) => {
    console.log('Customer data:', customer); // Debug log to see what fields are available
    
    if (customer.customer_type === 'individual') {
      const indCustomer = customer as any;
      setFormData({
        customer_type: 'individual',
        email: indCustomer.email || '',
        phone_number: indCustomer.phone_number || '',
        special_notes: indCustomer.special_notes || '',
        customer_name: indCustomer.customer_name || '',
        company_name: '',
        contact_person: '',
        // Try multiple possible field names for delivery address
        delivery_address: indCustomer.delivery_address || 
                         indCustomer.address || 
                         indCustomer.deliveryAddress || 
                         indCustomer.Address || ''
      });
    } else {
      const corpCustomer = customer as any;
      setFormData({
        customer_type: 'corporate',
        email: corpCustomer.email || '',
        phone_number: corpCustomer.phone_number || '',
        special_notes: corpCustomer.special_notes || '',
        customer_name: '',
        company_name: corpCustomer.company_name || '',
        contact_person: corpCustomer.contact_person || '',
        // Try multiple possible field names for delivery address
        delivery_address: corpCustomer.delivery_address || 
                         corpCustomer.address || 
                         corpCustomer.deliveryAddress || 
                         corpCustomer.Address || ''
      });
    }
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
        onClick: (customer: Customer) => {
          setSelectedCustomer(customer);
          setFormDataFromCustomer(customer);
          setModalMode("view");
          setIsFormOpen(true);
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
        onClick: (customer: Customer) => {
          setSelectedCustomer(customer);
          setFormDataFromCustomer(customer);
          setModalMode("edit");
          setIsFormOpen(true);
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
        onClick: (customer: Customer) => {
          handleDeleteClick(customer);
        },
        className: "text-red-600 hover:bg-red-50",
      });
    }

    return [...defaultActions, ...customActions];
  };

  // Form handlers
  const openCreateForm = () => {
    if (!permissions.canCreate) return;
    
    setSelectedCustomer(null);
    setFormData({
      customer_type: "individual",
      email: "",
      phone_number: "",
      special_notes: "",
      customer_name: "",
      company_name: "",
      contact_person: "",
      delivery_address: ""
    });
    setFormErrors({
      email: '',
      phone_number: '',
      customer_name: '',
      company_name: '',
      contact_person: '',
      delivery_address: ''
    });
    setModalMode("create");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedCustomer(null);
    setFormErrors({
      email: '',
      phone_number: '',
      customer_name: '',
      company_name: '',
      contact_person: '',
      delivery_address: ''
    });
  };

  // CRUD handlers
  const handleCreateCustomer = async () => {
    const result = await createCustomer(formData);
    if (result.success) {
      closeForm();
      const name = formData.customer_type === 'individual' ? formData.customer_name : formData.company_name;
      showSuccessMessage('Success!', `Customer "${name}" has been created successfully.`);
    } else {
      showErrorMessage('Creation Failed', result.error || 'Failed to create customer');
    }
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;
    const result = await updateCustomer(selectedCustomer.id, formData);
    if (result.success) {
      closeForm();
      const name = formData.customer_type === 'individual' ? formData.customer_name : formData.company_name;
      showSuccessMessage('Success!', `Customer "${name}" has been updated successfully.`);
    } else {
      showErrorMessage('Update Failed', result.error || 'Failed to update customer');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (modalMode === "create") {
      handleCreateCustomer();
    } else if (modalMode === "edit") {
      handleUpdateCustomer();
    }
  };

  const getFormTitle = () => {
    switch (modalMode) {
      case "create": return "Add New Customer";
      case "edit": return "Edit Customer";
      case "view": return "View Customer";
    }
  };

  //  Handle customer type change in form - Don't clear delivery_address for individual customers
  const handleCustomerTypeChange = (type: "individual" | "corporate") => {
    setFormData({
      ...formData,
      customer_type: type,
      ...(type === 'individual' ? {
        company_name: '',
        contact_person: ''
        // Don't clear delivery_address for individual customers
      } : {
        customer_name: ''
      })
    });
  };

  return (
    <div className="h-150 flex flex-col overflow-hidden ">
      <main className="flex-1 p-8 bg-blue-50/50 rounded-2xl flex flex-col overflow-hidden">
        {/* Fixed Header Section */}
        <div className="flex-shrink-0 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-blue-600">{title}</h1>
            {permissions.canCreate && (
              <Button onClick={openCreateForm} className="bg-blue-600 hover:bg-blue-700">
                + Add Customer
              </Button>
            )}
          </div>

          {/* Filter and Search Section */}
          <div className="mb-0 flex items-center justify-between gap-6">
            {/* Type Filter Tabs */}
            <CustomerTypeFilter
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              getCustomerCount={getCustomerCount}
            />

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
                className="pl-10 pr-4 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
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
            data={filteredCustomers}
            columns={getColumns()}
            actions={getActions()}
            loading={loading}
            emptyMessage={
              selectedType === "individual" 
                ? 'No customers found.Click "Add Customer" to get started.'
                : `No ${selectedType} customers found.Click "Add Customer" to get started.`
            }
          />
        </div>

        {/* Sliding Customer Form - Updated to use SlideModal like AppointmentManagement */}
        <SlideModal isOpen={isFormOpen} onClose={closeForm} title={getFormTitle()}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Customer Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Customer Type *</label>
              <select
                value={formData.customer_type}
                onChange={(e) => handleCustomerTypeChange(e.target.value as "individual" | "corporate")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={modalMode === "view"}
                required
              >
                <option value="individual">Individual</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>

            {/* Individual Customer Fields */}
            {formData.customer_type === 'individual' && (
              <div>
                <label className="block text-sm font-medium mb-2">Customer Name *</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  placeholder="Enter customer name"
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    formErrors.customer_name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2`}
                  readOnly={modalMode === "view"}
                  required
                />
                {formErrors.customer_name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.customer_name}</p>
                )}
              </div>
            )}

            {/* Corporate Customer Fields */}
            {formData.customer_type === 'corporate' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Company Name *</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formErrors.company_name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } focus:outline-none focus:ring-2`}
                    readOnly={modalMode === "view"}
                    required
                  />
                  {formErrors.company_name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.company_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Contact Person *</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formErrors.contact_person ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } focus:outline-none focus:ring-2`}
                    readOnly={modalMode === "view"}
                    required
                  />
                  {formErrors.contact_person && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.contact_person}</p>
                  )}
                </div>
              </>
            )}

            {/* Common Fields */}
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                readOnly={modalMode === "view"}
                required
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number *</label>
              <input
                type="tel"
                placeholder="Enter Phone number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.phone_number ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                readOnly={modalMode === "view"}
                required
              />
              {formErrors.phone_number && (
                <p className="mt-1 text-sm text-red-600">{formErrors.phone_number}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Delivery Address *</label>
              <textarea
                placeholder="Enter delivery address"
                value={formData.delivery_address}
                onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.delivery_address ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                rows={3}
                readOnly={modalMode === "view"}
                required
              />
              {formErrors.delivery_address && (
                <p className="mt-1 text-sm text-red-600">{formErrors.delivery_address}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Special Notes</label>
              {modalMode === "view" ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 min-h-[80px]">
                  {formData.special_notes || 'No special notes'}
                </div>
              ) : (
                <textarea
                  value={formData.special_notes}
                  onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter any special notes"
                />
              )}
            </div>

            {/* Button Section - Same pattern as AppointmentManagement */}
            <div className="flex justify-end pt-4 gap-3">
              {modalMode === "view" ? (
                <>
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
                </>
              ) : (
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {modalMode === "create" ? "Create Customer" : "Update Customer"}
                </Button>
              )}
            </div>
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

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          customerInfo={deleteModal.customerInfo}
          loading={deleteModal.isDeleting}
        />
      </main>
    </div>
  );
};

export default CustomerManagement;