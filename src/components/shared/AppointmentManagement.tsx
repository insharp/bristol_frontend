"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import ReusableTable from "@/components/ui/ReusableTable";
import SlideModal from "@/components/ui/SlideModal";
import { useAppointments, Appointment, FormData } from "@/app/hooks/useAppointment";
import { Plus, RefreshCw, Calendar, Clock, X } from "lucide-react";

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
    loading,
    formData,
    setFormData,
    filters,
    handleFilterChange,
    clearFilters,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    sendReminders,
    reminderStats,
    todayAppointments
  } = useAppointments(apiEndpoint);

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState(""); // New date filter state
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
    console.log('=== VALIDATION DEBUG ===');
    console.log('Modal mode:', modalMode);
    console.log('Form data:', formData);
    
    const errors = {
      customer_id: '',
      order_id: '',
      appointment_type: '',
      appointment_date: '',
      appointment_time: ''
    };

    if (modalMode === "create" && !formData.customer_id) {
      errors.customer_id = 'Customer is required';
      console.log('Validation error: Customer required for create mode');
    } else if (modalMode === "edit" && !formData.customer_id) {
      errors.customer_id = 'Customer information is missing';
      console.log('Validation error: Customer missing in edit mode');
    }

    if (!formData.order_id) {
      errors.order_id = 'Order is required';
      console.log('Validation error: Order required');
    }

    if (!formData.appointment_type) {
      errors.appointment_type = 'Appointment type is required';
      console.log('Validation error: Appointment type required');
    }

    if (!formData.appointment_date) {
      errors.appointment_date = 'Date is required';
      console.log('Validation error: Date required');
    } else {
      const selectedDate = new Date(formData.appointment_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today && modalMode === "create") {
        errors.appointment_date = 'Date cannot be in the past';
        console.log('Validation error: Past date not allowed for create');
      }
    }

    if (!formData.appointment_time) {
      errors.appointment_time = 'Time is required';
      console.log('Validation error: Time required');
    }

    console.log('Validation errors:', errors);
    setFormErrors(errors);
    
    const isValid = Object.values(errors).every(error => !error);
    console.log('Validation result:', isValid);
    console.log('=== VALIDATION DEBUG END ===');
    
    return isValid;
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
    fetchAppointments().then(result => {
      if (!result.success) {
        showErrorMessage('Fetch Error', result.error || 'Failed to load appointments');
      }
    });
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
        const customerName = appointment.customer_name || customer?.name || `Customer ${appointment.customer_id}`;
        const order = orders.find(o => Number(o.id) === Number(appointment.order_id));
        const orderNumber = appointment.order_number || order?.order_number || `Order ${appointment.order_id}`;
        
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

const columns = [
  { 
    key: "order_id", 
    label: "Order ID", 
    width: "170px",
    render: (value: any) => {
      const order = orders.find(o => Number(o.id) === Number(value));
      const orderNumber = order?.order_number || `Order ${value}`;
      return <span className="font-medium">{orderNumber}</span>;
    }
  },
  { 
    key: "customer_id", 
    label: "Customer ID", 
    width: "230px",
    render: (value: any) => (
      <span className="text-gray-600 text-center block"  style={{ paddingRight: "60px" }}> {value}</span>
    )
  },
  {
    key: "customer_name",
    label: "Customer Name",
    minWidth: "180px",
    render: (value: any, row: Appointment) => {
      const customer = customers.find(c => Number(c.id) === Number(row.customer_id));
      const customerName = value || customer?.name || `Customer ${row.customer_id}`;
      return <span className="font-medium">{customerName}</span>;
    },
  },
  {
    key: "appointment_date",
    label: "Date",
    width: "250px",
    render: (value: string) => {
      const date = new Date(value);
      return (
        <span>
          {date.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
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


  // Helper function to set form data from appointment
  const setFormDataFromAppointment = (appointment: Appointment) => {
    console.log('Setting form data from appointment:', appointment);
    
    const newFormData = {
      customer_id: appointment.customer_id.toString(),
      order_id: appointment.order_id.toString(),
      appointment_type: appointment.appointment_type,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      notes: appointment.notes || '',
      status: appointment.status
    };
    
    console.log('New form data being set:', newFormData);
    setFormData(newFormData);
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
        onClick: (appointment: Appointment) => {
          console.log('View appointment clicked:', appointment);
          setSelectedAppointment(appointment);
          setFormDataFromAppointment(appointment);
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
        onClick: (appointment: Appointment) => {
          console.log('Edit appointment clicked:', appointment);
          setSelectedAppointment(appointment);
          setFormDataFromAppointment(appointment);
          setModalMode("edit");
          setIsModalOpen(true);
        },
      });
    }

    if (permissions.canDelete) {
      defaultActions.push({
        label: "Cancel",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
        onClick: (appointment: Appointment) => {
          const customer = customers.find(c => Number(c.id) === Number(appointment.customer_id));
          const customerName = appointment.customer_name || customer?.name || `Customer ${appointment.customer_id}`;
          
          if (window.confirm(`Are you sure you want to cancel the appointment for "${customerName}"?`)) {
            handleDeleteAppointment(appointment.id, customerName);
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
    
    console.log('Opening create modal');
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
    console.log('Closing modal');
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
    console.log('=== CREATE APPOINTMENT DEBUG ===');
    console.log('Form data:', formData);
    
    if (!validateForm()) {
      console.log('CREATE: Validation failed');
      return;
    }
    
    console.log('Creating appointment with data:', formData);
    
    const result = await createAppointment();
    if (result.success) {
      closeModal();
      const customerName = customers.find(c => c.id === parseInt(formData.customer_id))?.name || 'Customer';
      showSuccessMessage('Success!', `Appointment for "${customerName}" has been scheduled successfully.`);
    } else {
      console.error('Create appointment error:', result.error);
      showErrorMessage('Creation Failed', result.error || 'Failed to create appointment');
    }
  };

  const handleUpdateAppointment = async () => {
    const validationResult = validateForm();
    
    if (!validationResult) {
      return;
    }
    
    if (!selectedAppointment) {
      return;
    }
    
    try {
      const result = await updateAppointment(selectedAppointment.id, formData);
     
      if (result.success) {
        closeModal();
        const customerName = customers.find(c => c.id === parseInt(formData.customer_id))?.name || 'Customer';
        showSuccessMessage('Success!', `Appointment for "${customerName}" has been updated successfully.`);
        await fetchAppointments();
      } else {
        console.error('Update appointment error:', result.error);
        showErrorMessage('Update Failed', result.error || 'Failed to update appointment');
      }
    } catch (error) {
      console.error('Update appointment exception:', error);
      showErrorMessage('Update Failed', 'An unexpected error occurred while updating the appointment');
    }
  };

  const handleDeleteAppointment = async (appointmentId: number, customerName: string) => {
    try {
      const result = await deleteAppointment(appointmentId);
      if (result.success) {
        showSuccessMessage('Success!', `Appointment for "${customerName}" has been cancelled.`);
        await fetchAppointments();
      } else {
        showErrorMessage('Cancellation Failed', result.error || 'Failed to cancel appointment');
      }
    } catch (error) {
      showErrorMessage('Cancellation Failed', 'An unexpected error occurred while cancelling the appointment');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modalMode === "create") {
      console.log('Calling handleCreateAppointment');
      await handleCreateAppointment();
    } else if (modalMode === "edit") {
      await handleUpdateAppointment();
    } 
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
      <main className="flex-1 p-6 bg-gray-50 flex flex-col overflow-hidden">
        {/* Header Section */}
        <div className="flex-shrink-0 mb-6">
          {/* Top Navigation Tabs */}
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setActiveTab("today")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "today"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              Today's Schedule
            </button>
            <button
              onClick={() => setActiveTab("view")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "view"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              View Appointments
            </button>
          </div>

          {/* Main Header */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
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
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
                    placeholder="Filter by date"
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
        <div className="flex-1 min-h-0 bg-white rounded-lg border border-gray-200">
          <ReusableTable
            data={filteredAppointments}
            columns={columns}
            actions={getActions()}
            loading={loading}
            emptyMessage="No appointments found."
          />
        </div>

        <SlideModal isOpen={isModalOpen} onClose={closeModal} title={getModalTitle()}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Customer *</label>
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.customer_id ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                disabled={modalMode === "view"}
                required
              >
                <option value="">Select Customer</option>
                {customers
                  .filter((customer, index, self) => 
                    index === self.findIndex(c => c.name.toLowerCase().trim() === customer.name.toLowerCase().trim())
                  )
                  .map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
              </select>
              {formErrors.customer_id && (
                <p className="mt-1 text-sm text-red-600">{formErrors.customer_id}</p>
              )}
            </div>
            {/* Order Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Order *</label>
              <select
                value={formData.order_id}
                onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.order_id ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                disabled={modalMode === "view"}
                required
              >
                <option value="">Select Order</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.order_number}
                  </option>
                ))}
              </select>
              {formErrors.order_id && (
                <p className="mt-1 text-sm text-red-600">{formErrors.order_id}</p>
              )}
            </div>

            {/* Appointment Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Appointment Type *</label>
              <select
                value={formData.appointment_type}
                onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value as any })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.appointment_type ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                disabled={modalMode === "view"}
                required
              >
                <option value="">Select Type</option>
                <option value="fitting">Fitting</option>
                <option value="pickup">Pickup</option>
              </select>
              {formErrors.appointment_type && (
                <p className="mt-1 text-sm text-red-600">{formErrors.appointment_type}</p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date *</label>
                <input
                  type="date"
                  value={formData.appointment_date}
                  onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    formErrors.appointment_date ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2`}
                  readOnly={modalMode === "view"}
                  required
                />
                {formErrors.appointment_date && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.appointment_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Time *</label>
                <input
                  type="time"
                  value={formData.appointment_time}
                  onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    formErrors.appointment_time ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2`}
                  readOnly={modalMode === "view"}
                  required
                />
                {formErrors.appointment_time && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.appointment_time}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              {modalMode === "view" ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 min-h-[80px]">
                  {formData.notes || 'No notes provided'}
                </div>
              ) : (
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Optional notes about the appointment..."
                />
              )}
            </div>

            {/* Button Section */}
            <div className="flex justify-end pt-4 gap-3">
              {modalMode === "view" ? (
                <>
                  {permissions.canDelete && (
                    <Button 
                      type="button"
                      onClick={() => {
                        if (!selectedAppointment) return;
                        
                        const customer = customers.find(c => Number(c.id) === Number(selectedAppointment.customer_id));
                        const customerName = selectedAppointment.customer_name || customer?.name || `Customer ${selectedAppointment.customer_id}`;
                        
                        if (window.confirm(`Are you sure you want to delete the appointment for "${customerName}"?`)) {
                          console.log('Deleting appointment from view modal');
                          setIsModalOpen(false);
                          handleDeleteAppointment(selectedAppointment.id, customerName);
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete
                    </Button>
                  )}
                  {permissions.canEdit && (
                    <Button 
                      type="button"
                      onClick={() => {
                        console.log('Navigating from view to edit modal');
                        setIsModalOpen(false);
                        setTimeout(() => {
                          setModalMode("edit");
                          setIsModalOpen(true);
                        }, 100);
                      }}
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
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      {modalMode === "create" ? "Scheduling..." : "Updating..."}
                    </>
                  ) : (
                    modalMode === "create" ? "Schedule Appointment" : "Update Appointment"
                  )}
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
      </main>
    </div>
  );
};

export default AppointmentManagement;