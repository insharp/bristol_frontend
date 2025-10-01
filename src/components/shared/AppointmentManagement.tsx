"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import ReusableTable from "@/components/ui/ReusableTable";
import SlideModal from "@/components/ui/SlideModal";

import { useAppointments, Appointment, FormData, Customer } from "@/app/hooks/useAppointment";
import { Plus, RefreshCw, Calendar, Clock, X } from "lucide-react";
import AppointmentForm from "../forms/AppointmentForm";

interface AppointmentManagementProps {
  title?: string;
  apiEndpoint?: string;
  permissions?: {
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canView?: boolean;
    canSendReminders?: boolean;
  };
  customActions?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: (appointment: Appointment) => void;
    className?: string;
  }>;
}

// Helper function to get customer display name for table
const getCustomerDisplayName = (customer: any) => {
  if (!customer) return 'Unknown Customer';
  
  // For table display, use a cleaner format
  if (customer.customer_type === 'corporate') {
    return customer.company_name || `Corporate Customer #${customer.id}`;
  } else {
    return customer.customer_name || `Customer #${customer.id}`;
  }
};

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
  appointmentInfo,
  loading = false
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  appointmentInfo: { customerName: string; appointmentType: string; date: string; time: string };
  loading?: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-blue-50/70 bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Appointment</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete the {appointmentInfo.appointmentType} appointment for "{appointmentInfo.customerName}" scheduled on {appointmentInfo.date} at {appointmentInfo.time}? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cancelling...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


const AppointmentManagement: React.FC<AppointmentManagementProps> = ({
  title = "Appointments",
  apiEndpoint,
  permissions = {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canView: true,
    canSendReminders: true
  },
  customActions = []
}) => {
  const {
    appointments,
    customers,
    orders,
    allOrders,
    loading,
    formData,
    setFormData,
    setOrders,
    filters,
    handleFilterChange,
    clearFilters,
    fetchAppointments,
    fetchCustomers,
    fetchOrders,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    sendReminders,
    reminderStats,
    todayAppointments
  } = useAppointments(apiEndpoint);

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<"today" | "view">("today");
  const [activeAppointmentType, setActiveAppointmentType] = useState<"fitting" | "pickup">("fitting");

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
    appointmentId: 0,
    appointmentInfo: {
      customerName: '',
      appointmentType: '',
      date: '',
      time: ''
    },
    isDeleting: false
  });

  // Form Validation State
  const [formErrors, setFormErrors] = useState({
    customer_id: '',
    order_id: '',
    appointment_type: '',
    appointment_date: '',
    appointment_time: ''
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

  const validateForm = () => {
    const errors = {
      customer_id: '',
      order_id: '',
      appointment_type: '',
      appointment_date: '',
      appointment_time: ''
    };

    if (modalMode === "create" && !formData.customer_id) {
      errors.customer_id = 'Customer is required';
    } else if (modalMode === "edit" && !formData.customer_id) {
      errors.customer_id = 'Customer information is missing';
    }

    if (!formData.order_id) {
      errors.order_id = 'Order is required';
    }

    if (!formData.appointment_type) {
      errors.appointment_type = 'Appointment type is required';
    }

    if (!formData.appointment_date) {
      errors.appointment_date = 'Date is required';
    } else {
      const selectedDate = new Date(formData.appointment_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today && modalMode === "create") {
        errors.appointment_date = 'Date cannot be in the past';
      }
    }

    if (!formData.appointment_time) {
      errors.appointment_time = 'Time is required';
    }

    setFormErrors(errors);
    return Object.values(errors).every(error => !error);
  };

  // Clear form errors when form data changes
  useEffect(() => {
    const hasErrors = Object.values(formErrors).some(error => error !== '');
    if (hasErrors) {
      setFormErrors({
        customer_id: '',
        order_id: '',
        appointment_type: '',
        appointment_date: '',
        appointment_time: ''
      });
    }
  }, [formData]);

  // Initial fetch
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const appointmentsResult = await fetchAppointments();
        if (!appointmentsResult.success) {
          showErrorMessage('Fetch Error', appointmentsResult.error || 'Failed to load appointments');
        }

        const customersResult = await fetchCustomers();
        if (!customersResult.success) {
          showErrorMessage('Fetch Error', customersResult.error || 'Failed to load customers');
        }

        const ordersResult = await fetchOrders();
        if (!ordersResult.success) {
          showErrorMessage('Fetch Error', ordersResult.error || 'Failed to load orders');
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        showErrorMessage('Loading Error', 'Failed to load application data');
      }
    };

    loadInitialData();
  }, []);

  // Clear date filter when switching to today tab
  useEffect(() => {
    if (activeTab === "today") {
      setDateFilter("");
    }
  }, [activeTab]);

  // Filter appointments based on active tab, appointment type, search, and date
  const getFilteredAppointments = () => {
    let filtered = appointments;

    // Filter by appointment type
    filtered = filtered.filter(appointment => 
      appointment.appointment_type === activeAppointmentType
    );

    // Filter by tab (today vs all)
    if (activeTab === "today") {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(appointment => 
        appointment.appointment_date === today
      );
    } else if (activeTab === "view" && dateFilter) {
      // Apply date filter only in view tab
      filtered = filtered.filter(appointment => 
        appointment.appointment_date === dateFilter
      );
    }

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(appointment => {
        const customer = customers.find(c => Number(c.id) === Number(appointment.customer_id));
        const customerName = appointment.customer_name || getCustomerDisplayName(customer);
        const order = orders.find(o => Number(o.id) === Number(appointment.order_id));
        const orderNumber = appointment.order_number || order?.order_number || `${appointment.order_id}`;
        
        return (
          customerName.toLowerCase().includes(searchLower) ||
          orderNumber.toLowerCase().includes(searchLower) ||
          appointment.id.toString().includes(searchLower) ||
          appointment.appointment_date.includes(searchQuery) ||
          appointment.appointment_time.includes(searchQuery)
        );
      });
    }

    return filtered;
  };

  const filteredAppointments = getFilteredAppointments();

  // Clear date filter function
  const clearDateFilter = () => {
    setDateFilter("");
  };

  // Helper function to format appointment info for delete modal
  const getAppointmentInfo = (appointment: Appointment) => {
    const customer = customers.find(c => Number(c.id) === Number(appointment.customer_id));
    const customerName = appointment.customer_name || getCustomerDisplayName(customer);
    
    const date = new Date(appointment.appointment_date);
    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const [hours, minutes] = appointment.appointment_time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    const formattedTime = `${displayHour}:${minutes} ${ampm}`;

    return {
      customerName,
      appointmentType: appointment.appointment_type,
      date: formattedDate,
      time: formattedTime
    };
  };

  // Helper function to set form data from appointment - enhanced for new customer selection format
  const setFormDataFromAppointment = (appointment: Appointment) => {
    console.log('\n=== SETTING FORM DATA FROM APPOINTMENT ===');
    console.log('Appointment data:', appointment);
    console.log('Appointment order_id:', appointment.order_id);
    
    // Use allOrders instead of filtered orders to find the match
    // The appointment.order_id corresponds to our order.original_id
    const matchingOrder = allOrders.find(order => {
      const match = order.original_id === appointment.order_id;
      console.log(`Checking order ${order.id}: original_id(${order.original_id}) === appointment.order_id(${appointment.order_id}) = ${match}`);
      return match;
    });
    
    console.log('Available orders:', allOrders.map(o => ({ id: o.id, original_id: o.original_id, order_number: o.order_number, customer_id: o.customer_id })));
    console.log('Looking for appointment.order_id:', appointment.order_id);
    console.log('Matching order found:', matchingOrder);
    
    // Find the customer entries that match this customer ID
    const matchingCustomers = customers.filter(c => c.id === appointment.customer_id);
    console.log('Matching customers:', matchingCustomers);
    
    // For editing existing appointments, we need to determine which customer/batch combination was used
    // If there's only one match, use it. If multiple, we may need to infer from the order
    let selectedCustomer = matchingCustomers[0]; // Default to first match
    
    if (matchingCustomers.length > 1 && matchingOrder) {
      // Try to match based on bulk_id if available
      const customerWithMatchingBatch = matchingCustomers.find(c => 
        c.batch_measurement_id && String(c.batch_measurement_id) === matchingOrder.bulk_id
      );
      if (customerWithMatchingBatch) {
        selectedCustomer = customerWithMatchingBatch;
      }
    }
    
    console.log('Selected customer for form:', selectedCustomer);
    
    // Create customer selection value in the new format: customerId|batchId
    const customerSelectionValue = selectedCustomer 
      ? `${selectedCustomer.id}|${selectedCustomer.batch_measurement_id || 'none'}`
      : appointment.customer_id.toString();
    
    const newFormData = {
      customer_id: customerSelectionValue,
      order_id: matchingOrder ? String(matchingOrder.id) : "",
      appointment_type: appointment.appointment_type,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      notes: appointment.notes || '',
      status: appointment.status
    };
    
    console.log('Setting form data:', newFormData);
    setFormData(newFormData);
    
    // Manually trigger order filtering for this customer
    console.log('Manually triggering order filter for customer selection:', customerSelectionValue);
    // The filterOrdersByCustomer will be called automatically by the useEffect
    
    // If no order found, check if we need to wait for data to load
    if (!matchingOrder) {
      console.warn('No matching order found! This might be a data loading timing issue.');
      console.log('Total allOrders:', allOrders.length);
      console.log('Total customers:', customers.length);
    }
  };

  // Handler to open delete modal from table action
  const handleDeleteClick = (appointment: Appointment) => {
    const appointmentInfo = getAppointmentInfo(appointment);
    setDeleteModal({
      isOpen: true,
      appointmentId: appointment.id,
      appointmentInfo,
      isDeleting: false
    });
  };



// Handler to open delete modal from view modal
const handleDeleteFromView = () => {
  if (!permissions.canDelete || !selectedAppointment) return;
  
  // Keep the view modal open, just show the delete confirmation on top
  const appointmentInfo = getAppointmentInfo(selectedAppointment);
  setDeleteModal({
    isOpen: true,
    appointmentId: selectedAppointment.id,
    appointmentInfo,
    isDeleting: false
  });
};

 // Handler to confirm deletion
const handleConfirmDelete = async () => {
  setDeleteModal(prev => ({ ...prev, isDeleting: true }));
  
  try {
    const result = await deleteAppointment(deleteModal.appointmentId);
    if (result.success) {
      // Close both modals
      setDeleteModal({
        isOpen: false,
        appointmentId: 0,
        appointmentInfo: {
          customerName: '',
          appointmentType: '',
          date: '',
          time: ''
        },
        isDeleting: false
      });
      setIsModalOpen(false);
      setSelectedAppointment(null);
      
      setTimeout(() => {
        showSuccessMessage('Success!', `Appointment for "${deleteModal.appointmentInfo.customerName}" has been deleted successfully.`);
      }, 100);
      
      await fetchAppointments();
    } else {
      showErrorMessage('Cancellation Failed', result.error || 'Failed to cancel appointment');
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  } catch (error) {
    console.error('Failed to cancel appointment:', error);
    showErrorMessage('Cancellation Failed', 'Failed to cancel appointment. Please try again.');
    setDeleteModal(prev => ({ ...prev, isDeleting: false }));
  }
};

  // Handler to close delete modal
  const handleCloseDeleteModal = () => {
    if (deleteModal.isDeleting) return;
    
    setDeleteModal({
      isOpen: false,
      appointmentId: 0,
      appointmentInfo: {
        customerName: '',
        appointmentType: '',
        date: '',
        time: ''
      },
      isDeleting: false
    });
  };

  const columns = [
    { 
      key: "order_id", 
      label: "Order ID", 
      width: "170px",
      render: (value: any) => {
        const order = orders.find(o => Number(o.id) === Number(value));
        const orderNumber = order?.order_number || `${value}`;
        return <span className="font-medium">{orderNumber}</span>;
      }
    },
    { 
      key: "customer_id", 
      label: "Customer ID", 
      width: "230px",
      render: (value: any) => (
        <span className="text-gray-600 text-center block" style={{ paddingRight: "60px" }}>{value}</span>
      )
    },
    {
      key: "customer_name",
      label: "Customer Name",
      minWidth: "180px",
      render: (value: any, row: Appointment) => {
        const customer = customers.find(c => Number(c.id) === Number(row.customer_id));
        const customerName = getCustomerDisplayName(customer);
        return <span className="font-medium">{customerName}</span>;
      },
    },
    {
      key: "appointment_date",
      label: "Date (dd/mm/yyyy)",
      width: "250px",
      render: (value: string) => {
        const date = new Date(value);
        return (
          <span>
            {date.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        );
      },
    },
    {
      key: "appointment_time",
      label: "Time",
      width: "150px",
      render: (value: string) => {
        const [hours, minutes] = value.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return <span>{`${displayHour}:${minutes} ${ampm}`}</span>;
      },
    },
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
        onClick: (appointment: Appointment) => {
          setSelectedAppointment(appointment);
          // Set form data and trigger customer filtering first
          setFormDataFromAppointment(appointment);
          // Small delay to let customer filtering complete
          setTimeout(() => {
            setModalMode("view");
            setIsModalOpen(true);
          }, 100);
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
        onClick: (appointment: Appointment) => {
          setSelectedAppointment(appointment);
          // Set form data and trigger customer filtering first
          setFormDataFromAppointment(appointment);
          // Small delay to let customer filtering complete
          setTimeout(() => {
            setModalMode("edit");
            setIsModalOpen(true);
          }, 100);
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
        onClick: (appointment: Appointment) => {
          handleDeleteClick(appointment);
        },
        className: "text-red-600 hover:bg-red-50",
      });
    }

    return [...defaultActions, ...customActions];
  };

  // Modal handlers
  const openCreateModal = () => {
    if (!permissions.canCreate) return;
    
    setSelectedAppointment(null);
    setFormData({
      customer_id: "",
      order_id: "",
      appointment_type: "",
      appointment_date: "",
      appointment_time: "",
      notes: "",
      status: undefined
    });
    setFormErrors({
      customer_id: '',
      order_id: '',
      appointment_type: '',
      appointment_date: '',
      appointment_time: ''
    });
    setModalMode("create");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
    setFormErrors({
      customer_id: '',
      order_id: '',
      appointment_type: '',
      appointment_date: '',
      appointment_time: ''
    });
  };

  // CRUD handlers
  const handleCreateAppointment = async () => {
    if (!validateForm()) {
      return;
    }
    
    const result = await createAppointment();
    if (result.success) {
      closeModal();
      // Parse customer selection to get customer info for success message
      const [customerIdStr] = formData.customer_id.split('|');
      const customerId = parseInt(customerIdStr);
      const customer = customers.find(c => c.id === customerId);
      const customerName = getCustomerDisplayName(customer);
      showSuccessMessage('Success!', `Appointment for "${customerName}" has been scheduled successfully.`);
    } else {
      showErrorMessage('Creation Failed', result.error || 'Failed to create appointment');
    }
  };

  const handleUpdateAppointment = async () => {
    if (!validateForm()) {
      return;
    }
    
    if (!selectedAppointment) {
      return;
    }
    
    try {
      const result = await updateAppointment(selectedAppointment.id, formData);
     
      if (result.success) {
        closeModal();
        // Parse customer selection to get customer info for success message
        const [customerIdStr] = formData.customer_id.split('|');
        const customerId = parseInt(customerIdStr);
        const customer = customers.find(c => c.id === customerId);
        const customerName = getCustomerDisplayName(customer);
        showSuccessMessage('Success!', `Appointment for "${customerName}" has been updated successfully.`);
        await fetchAppointments();
      } else {
        showErrorMessage('Update Failed', result.error || 'Failed to update appointment');
      }
    } catch (error) {
      console.error('Update appointment exception:', error);
      showErrorMessage('Update Failed', 'An unexpected error occurred while updating the appointment');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modalMode === "create") {
      await handleCreateAppointment();
    } else if (modalMode === "edit") {
      await handleUpdateAppointment();
    } 
  };

  const handleEditClick = () => {
    // Just switch the mode directly - no timeout needed for seamless transition
    setModalMode("edit");
    // Modal stays open, just switches from view to edit mode
  };

  const getModalTitle = () => {
    switch (modalMode) {
      case "create": return "Schedule New Appointment";
      case "edit": return "Edit Appointment";
      case "view": return "View Appointment";
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <main className="flex-1 p-6 bg-blue-50/50 rounded-2xl flex flex-col overflow-hidden">
        {/* Header Section */}
        <div className="flex-shrink-0 mb-6">
          {/* Top Navigation Tabs */}
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setActiveTab("today")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "today"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              Today's Schedule
            </button>
            <button
              onClick={() => setActiveTab("view")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "view"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              View Appointments
            </button>
          </div>

          {/* Main Header */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-blue-600">{title}</h1>
            {permissions.canCreate && (
              <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
                + Add Appointment
              </Button>
            )}
          </div>

          {/* Appointment Type Tabs with Search Bar and Date Filter */}
          <div className="flex justify-between items-center border-b border-gray-200 mb-2 pb-2">
            {/* Left side - Appointment Type Tabs */}
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveAppointmentType("fitting")}
                className={`pb-1 px-1 font-medium text-sm transition-colors ${
                  activeAppointmentType === "fitting"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Fitting
              </button>
              <button
                onClick={() => setActiveAppointmentType("pickup")}
                className={`pb-1 px-1 font-medium text-sm transition-colors ${
                  activeAppointmentType === "pickup"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Pick Up
              </button>
            </div>

            {/* Right side - Search Bar and Date Filter (only in view tab) */}
            <div className="flex items-center space-x-4">
              {/* Date Filter - Only show in View Appointments tab */}
              {activeTab === "view" && (
                <div className="relative">
                  <input
                    type="date"
                    value={dateFilter}  
                    onChange={(e) => setDateFilter(e.target.value)} 
                    className="w-full px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {dateFilter && (
                    <button
                      onClick={clearDateFilter}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-700"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>
              )}
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
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 min-h-0">
          <ReusableTable
            data={filteredAppointments}
            columns={columns}
            actions={getActions()}
            loading={loading}
            emptyMessage='No appointments found. Click "Add Appointment" to get started.'
          />
        </div>

        {/* Modal with Separated Form */}
        <SlideModal isOpen={isModalOpen} onClose={closeModal} title={getModalTitle()}>
          <AppointmentForm
            formData={formData}
            setFormData={setFormData}
            customers={customers}
            orders={orders}
            modalMode={modalMode}
            loading={loading}
            formErrors={formErrors}
            onSubmit={handleSubmit}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteFromView}
            onCancel={closeModal} 
            permissions={permissions}
          />
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
          appointmentInfo={deleteModal.appointmentInfo}
          loading={deleteModal.isDeleting}
        />
      </main>
    </div>
  );
};

export default AppointmentManagement;