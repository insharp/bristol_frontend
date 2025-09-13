"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import ReusableTable from "@/components/ui/ReusableTable";
import { useCustomers, Customer, CustomerType } from "@/app/hooks/useCustomers";
import MessageModal from "@/components/ui/ErrorMessageModal"
import CustomerTypeFilter from "@/components/Filter/CustomerTypeFilter";
import CustomerForm from "@/components/forms/CustomerForm";


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

  // Dynamic table columns
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
      }
    );

    if (selectedType === "corporate" || selectedType === "all") {
      baseColumns.push({ key: "delivery_address", label: "Delivery Address" });
    }

    return baseColumns;
  };

  // Helper function to set form data from customer
  const setFormDataFromCustomer = (customer: Customer) => {
    if (customer.customer_type === 'individual') {
      const indCustomer = customer as any;
      setFormData({
        customer_type: 'individual',
        email: indCustomer.email,
        phone_number: indCustomer.phone_number,
        special_notes: indCustomer.special_notes || '',
        customer_name: indCustomer.customer_name,
        company_name: '',
        contact_person: '',
        delivery_address: ''
      });
    } else {
      const corpCustomer = customer as any;
      setFormData({
        customer_type: 'corporate',
        email: corpCustomer.email,
        phone_number: corpCustomer.phone_number,
        special_notes: corpCustomer.special_notes || '',
        customer_name: '',
        company_name: corpCustomer.company_name,
        contact_person: corpCustomer.contact_person,
        delivery_address: corpCustomer.delivery_address
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
          const name = customer.customer_type === 'individual' 
            ? (customer as any).customer_name 
            : (customer as any).company_name;
          if (window.confirm(`Are you sure you want to delete customer "${name}"?`)) {
            handleDeleteCustomer(customer.id);
          }
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

  const handleDeleteCustomer = async (customerId: string) => {
    const customerToDelete = customers.find(c => c.id === customerId);
    const result = await deleteCustomer(customerId);
    if (result.success) {
      const name = customerToDelete 
        ? (customerToDelete.customer_type === 'individual' 
            ? (customerToDelete as any).customer_name 
            : (customerToDelete as any).company_name)
        : 'Customer';
      showSuccessMessage('Success!', `Customer "${name}" has been deleted successfully.`);
    } else {
      showErrorMessage('Deletion Failed', result.error || 'Failed to delete customer');
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

  // Handle customer type change in form
  const handleCustomerTypeChange = (type: "individual" | "corporate") => {
    setFormData({
      ...formData,
      customer_type: type,
      ...(type === 'individual' ? {
        company_name: '',
        contact_person: '',
        delivery_address: ''
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
                ? "No customers found." 
                : `No ${selectedType} customers found.`
            }
          />
        </div>

        {/* Sliding Customer Form */}
        <CustomerForm
          isOpen={isFormOpen}
          title={getFormTitle()}
          formData={formData}
          formErrors={formErrors}
          modalMode={modalMode}
          onClose={closeForm}
          onFormDataChange={setFormData}
          onCustomerTypeChange={handleCustomerTypeChange}
          onSubmit={handleSubmit}
        />

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

export default CustomerManagement;