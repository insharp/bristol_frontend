import { useState, useEffect } from "react";

export interface BaseAppointment {
  id: number;
  customer_id: number;
  order_id: number;
  appointment_type: "fitting" | "pickup";
  appointment_date: string;
  appointment_time: string;
  notes?: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "rescheduled";
}

export interface Appointment extends BaseAppointment {
  customer_name?: string;
  order_number?: string;
}

export interface Filters {
  customer_id?: number;
  order_id?: number;
  appointment_type?: "fitting" | "pickup";
  status?: "scheduled" | "confirmed" | "completed" | "cancelled" | "rescheduled";
  date_from?: string;
  date_to?: string;
  search?: string;
  skip?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// Updated FormData interface with status property
export interface FormData {
  customer_id: string;
  order_id: string;
  appointment_type: "fitting" | "pickup" | "";
  appointment_date: string;
  appointment_time: string;
  notes: string;
  status?: "scheduled" | "confirmed" | "completed" | "cancelled" | "rescheduled";
}

export interface ReminderStats {
  sent_today: number;
  success_rate: number;
  upcoming_reminders: number;
}

// Define Order interface for type safety
export interface Order {
  id: number;
  order_number: string;
  customer_id?: number;
}

export const useAppointments = (apiEndpoint?: string) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Updated formData initialization with status
  const [formData, setFormData] = useState<FormData>({
    customer_id: "",
    order_id: "",
    appointment_type: "",
    appointment_date: "",
    appointment_time: "",
    notes: "",
    status: undefined,
  });
  
  const [filters, setFilters] = useState<Filters>({
    appointment_type: undefined,
    status: undefined,
    date_from: undefined,
    date_to: undefined,
    search: undefined,
    skip: 0,
    limit: 100,
    sort_by: "appointment_date",
    sort_order: "asc",
  });
  const [reminderStats, setReminderStats] = useState<ReminderStats>({
    sent_today: 0,
    success_rate: 100,
    upcoming_reminders: 0,
  });

  const baseUrl = apiEndpoint || `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}/appointment`;
  const customerBaseUrl = `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}`;
  const ordersBaseUrl = `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}`;
  const today = new Date().toISOString().split("T")[0];

  // Fetch customers from database
const fetchCustomers = async () => {
  try {
    console.log('Fetching customers from:', `${customerBaseUrl}/customer`);
    const res = await fetch(`${customerBaseUrl}/customer`, { 
      credentials: "include" 
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('Customers API response:', data);
      const customerData = data.data || data;
      
      // Transform customer data with better null handling
      const transformedCustomers = customerData.map((customer: any) => {
        console.log(`Processing customer ${customer.id}:`, {
          customer_type: customer.customer_type,
          customer_name: customer.customer_name,
          first_name: customer.first_name,
          company_name: customer.company_name,
          contact_person: customer.contact_person
        });
        
        let displayName;
        
        // Check if it's an individual customer (normal/individual type)
        if (customer.customer_type === 'normal' || customer.customer_type === 'individual' || customer.customer_type === 'personal') {
          // For individual customers, try multiple possible field names
          displayName = customer.customer_name || 
                       customer.first_name || 
                       customer.name || 
                       customer.full_name;
          
          // If no valid name found, use fallback
          if (!displayName || displayName === 'null' || displayName.toString().trim() === '') {
            displayName = `Individual Customer #${customer.id}`;
          }
        } else if (customer.customer_type === 'corporate' || customer.customer_type === 'company' || customer.customer_type === 'business') {
          // For corporate customers
          const companyName = customer.company_name || 'Unknown Company';
          const contactPerson = customer.contact_person || 'Unknown Contact';
          displayName = `${companyName} (${contactPerson})`;
        } else {
          // Unknown customer type - check which fields have data
          if (customer.company_name || customer.contact_person) {
            // Looks like corporate
            const companyName = customer.company_name || 'Unknown Company';
            const contactPerson = customer.contact_person || 'Unknown Contact';
            displayName = `${companyName} (${contactPerson})`;
          } else {
            // Treat as individual
            displayName = customer.customer_name || 
                         customer.first_name || 
                         customer.name || 
                         customer.full_name ||
                         `Customer #${customer.id}`;
          }
        }
        
        // Final cleanup
        if (!displayName || displayName === 'null' || displayName.toString().trim() === '') {
          displayName = `Customer #${customer.id}`;
        }
        
        return {
          id: parseInt(customer.id),
          name: displayName.toString().trim()
        };
      });
      
      console.log('Transformed customers:', transformedCustomers);
      setCustomers(transformedCustomers);
      return { success: true, data: transformedCustomers };
    } else {
      console.error("Failed to fetch customers, status:", res.status);
      setCustomers([]);
      return { success: false, error: "Failed to fetch customers" };
    }
  } catch (err) {
    console.error("Error fetching customers:", err);
    setCustomers([]);
    return { success: false, error: "Connection error while fetching customers" };
  }
};

  // Updated fetchOrders to store all orders and optionally filter by customer
  const fetchOrders = async (customerId?: number) => {
    try {
      const url = `${ordersBaseUrl}/orders/all`;
      console.log('Fetching orders from:', url);
      console.log('Customer ID filter:', customerId);
      
      const res = await fetch(url, { 
        credentials: "include" 
      });
      
      console.log('Orders API response status:', res.status);
      console.log('Orders API response ok:', res.ok);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Orders API raw response:', data);
        
        // Handle different possible response structures
        let orderData;
        if (Array.isArray(data)) {
          orderData = data;
        } else if (data.data && Array.isArray(data.data)) {
          orderData = data.data;
        } else if (data.orders && Array.isArray(data.orders)) {
          orderData = data.orders;
        } else {
          console.error('Unexpected orders data structure:', data);
          orderData = [];
        }
        
        console.log('Orders data to transform:', orderData);
        
        // Transform order data with better error handling and include customer_id
        const transformedOrders: Order[] = orderData
          .filter((order: any) => order && (order.id || order.order_id)) // Filter out invalid orders
          .map((order: any): Order => {
            const id = order.id || order.order_id;
            const orderNumber = order.order_number || order.orderNumber || order.number || `${id}`;
            const orderCustomerId = order.customer_id || order.customerId;
            
            return {
              id: parseInt(String(id)),
              order_number: String(orderNumber),
              customer_id: orderCustomerId ? parseInt(String(orderCustomerId)) : undefined
            };
          })
          .filter((order: Order) => !isNaN(order.id)); // Remove any with invalid IDs
        
        console.log('Transformed orders:', transformedOrders);
        
        // Store all orders for reference
        setAllOrders(transformedOrders);
        
        // Filter orders by customer if customerId is provided
        let filteredOrders = transformedOrders;
        if (customerId) {
          filteredOrders = transformedOrders.filter((order: Order) => 
            order.customer_id === parseInt(String(customerId))
          );
          console.log(`Filtered orders for customer ${customerId}:`, filteredOrders);
        }
        
        setOrders(filteredOrders);
        console.log('Number of orders loaded:', filteredOrders.length);
        
        return { success: true, data: filteredOrders };
      } else {
        const errorText = await res.text();
        console.error("Failed to fetch orders, status:", res.status, "response:", errorText);
        setOrders([]);
        return { success: false, error: `Failed to fetch orders: ${res.status} ${errorText}` };
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setOrders([]);
      return { success: false, error: `Connection error while fetching orders: ${err}` };
    }
  };

  // New function to filter orders based on selected customer
  const filterOrdersByCustomer = (customerId: string) => {
    console.log('Filtering orders by customer:', customerId);
    console.log('All orders available:', allOrders);
    
    if (!customerId) {
      // If no customer selected, show all orders
      setOrders(allOrders);
      return;
    }
    
    const customerIdNum = parseInt(customerId);
    const filteredOrders = allOrders.filter((order: Order) => 
      order.customer_id === customerIdNum
    );
    
    console.log(`Orders filtered for customer ${customerIdNum}:`, filteredOrders);
    setOrders(filteredOrders);
    
    // Clear the selected order if it doesn't belong to the new customer
    if (formData.order_id) {
      const selectedOrderBelongsToCustomer = filteredOrders.some((order: Order) => 
        order.id === parseInt(formData.order_id)
      );
      
      if (!selectedOrderBelongsToCustomer) {
        console.log('Clearing selected order as it does not belong to the selected customer');
        setFormData(prev => ({ ...prev, order_id: "" }));
      }
    }
  };
  
  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== "") params.append(k, v.toString());
      });

      const res = await fetch(`${baseUrl}/?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Appointment[] = await res.json();
      setAppointments(data);
      return { success: true, data };
    } catch (err) {
      console.error(err);
      setError("Failed to fetch appointments");
      return { success: false, error: "Failed to fetch appointments" };
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async () => {
    // Validate required fields
    if (
      !formData.customer_id ||
      !formData.order_id ||
      !formData.appointment_type ||
      !formData.appointment_date ||
      !formData.appointment_time
    ) {
      return { success: false, error: "Please fill all required fields" };
    }

    // Validate that customer_id and order_id are valid numbers
    const customerId = parseInt(formData.customer_id);
    const orderId = parseInt(formData.order_id);
    
    if (isNaN(customerId) || isNaN(orderId)) {
      return { success: false, error: "Invalid customer or order selection" };
    }

    setLoading(true);
    try {
      // Create payload matching your backend API structure
      const payload = {
        customer_id: customerId,  
        order_id: orderId,
        appointment_type: formData.appointment_type,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        status: "scheduled", // Set default status
        notes: formData.notes || null,
      };

      console.log('Creating appointment with payload:', payload);

      const res = await fetch(`${baseUrl}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        console.error('Create appointment failed:', errorData);
        return { success: false, error: errorData.message || `Failed to create appointment (HTTP ${res.status})` };
      }

      const createdAppointment = await res.json();
      console.log('Successfully created appointment:', createdAppointment);

      // Updated reset form data with status
      setFormData({
        customer_id: "",
        order_id: "",
        appointment_type: "",
        appointment_date: "",
        appointment_time: "",
        notes: "",
        status: undefined,
      });

      // Reset orders to show all orders when form is cleared
      setOrders(allOrders);

      // Refresh appointments list
      await fetchAppointments();
      return { success: true, data: createdAppointment, message: "Appointment scheduled successfully!" };
    } catch (err) {
      console.error('Create appointment error:', err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create appointment";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Simplified and more reliable updateAppointment function
  const updateAppointment = async (appointmentId: number, updateData?: Partial<FormData>) => {
    console.log('=== UPDATE APPOINTMENT HOOK DEBUG ===');
    console.log('Starting updateAppointment function');
    console.log('Appointment ID:', appointmentId);
    console.log('Update data received:', updateData);
    console.log('Current form data:', formData);

    setLoading(true);
    
    try {
      const dataToUse = updateData || formData;
      console.log('Data to use for update:', dataToUse);

      // Find the existing appointment
      const existingAppointment = appointments.find(a => a.id === appointmentId);
      console.log('Found existing appointment:', existingAppointment);
      
      if (!existingAppointment) {
        console.error('Appointment not found for ID:', appointmentId);
        console.log('Available appointments:', appointments.map(a => ({ id: a.id, customer_id: a.customer_id })));
        return { success: false, error: "Appointment not found" };
      }

      // Build the payload with only the fields that should be updated
      const payload: any = {};
      
      // Always include the main appointment fields if they exist
      if (dataToUse.appointment_type) {
        payload.appointment_type = dataToUse.appointment_type;
      }
      
      if (dataToUse.appointment_date) {
        payload.appointment_date = dataToUse.appointment_date;
      }
      
      if (dataToUse.appointment_time) {
        payload.appointment_time = dataToUse.appointment_time;
      }
      
      // Handle order_id conversion
      if (dataToUse.order_id) {
        const orderId = parseInt(dataToUse.order_id);
        if (!isNaN(orderId)) {
          payload.order_id = orderId;
        }
      }
      
      // Handle customer_id conversion (if needed for updates)
      if (dataToUse.customer_id) {
        const customerId = parseInt(dataToUse.customer_id);
        if (!isNaN(customerId)) {
          payload.customer_id = customerId;
        }
      }
      
      // Handle notes (allow empty string to clear notes)
      if (dataToUse.notes !== undefined) {
        payload.notes = dataToUse.notes || null;
      }
      
      // Handle status if provided
      if (dataToUse.status) {
        payload.status = dataToUse.status;
      }

      console.log('Final payload:', payload);
      
      // Validate that we have something to update
      if (Object.keys(payload).length === 0) {
        console.error('No valid fields to update');
        return { success: false, error: "No valid fields to update" };
      }

      const url = `${baseUrl}/${appointmentId}`;
      console.log('Making PUT request to:', url);
      console.log('With payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(url, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      // Handle response
      let responseData;
      const responseText = await response.text();
      console.log('Response text:', responseText);

      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError);
        responseData = { message: responseText };
      }

      if (!response.ok) {
        console.error('Update failed with status:', response.status);
        console.error('Error response:', responseData);
        return { 
          success: false, 
          error: responseData.detail || responseData.message || `HTTP ${response.status}` 
        };
      }

      console.log('Update successful!');
      
      // Refresh the appointments list
      await fetchAppointments();
      
      return { 
        success: true, 
        data: responseData, 
        message: "Appointment updated successfully!" 
      };

    } catch (error) {
      console.error('Update appointment network error:', error);
      const errorMessage = error instanceof Error ? error.message : "Network error occurred";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteAppointment = async (appointmentId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/${appointmentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        console.error('Delete appointment failed:', errorData);
        return { success: false, error: errorData.message || `Failed to delete appointment (HTTP ${res.status})` };
      }

      console.log('Successfully deleted appointment:', appointmentId);
      await fetchAppointments();
      return { success: true, message: "Appointment deleted successfully!" };
    } catch (err) {
      console.error('Delete appointment error:', err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete appointment";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const sendReminders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/send-reminders`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        return { success: false, error: errorData.message || "Failed to send reminders" };
      }

      const data = await res.json();
      setReminderStats((prev) => ({
        ...prev,
        sent_today: prev.sent_today + (data.sent_count || 0),
      }));

      return { success: true, message: data.message || "Reminders sent successfully" };
    } catch (err) {
      console.error('Send reminders error:', err);
      const errorMessage = err instanceof Error ? err.message : "Failed to send reminders";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, skip: 0 }));
  };

  const clearFilters = () => {
    setFilters({
      appointment_type: undefined,
      status: undefined,
      date_from: undefined,
      date_to: undefined,
      search: undefined,
      skip: 0,
      limit: 100,
      sort_by: "appointment_date",
      sort_order: "asc",
    });
  };

  // FIXED: Improved useEffect with error handling
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('=== LOADING INITIAL DATA ===');
      
      // Fetch customers and orders from database
      const customersResult = await fetchCustomers();
      const ordersResult = await fetchOrders(); // Load all orders initially
      const appointmentsResult = await fetchAppointments();
      
      console.log('Initial data loading results:', {
        customers: customersResult.success ? 'Success' : customersResult.error,
        orders: ordersResult.success ? 'Success' : ordersResult.error,
        appointments: appointmentsResult.success ? 'Success' : appointmentsResult.error
      });
      
      console.log('=== INITIAL DATA LOADED ===');
    };
    
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [filters]);

  // New useEffect to filter orders when customer changes
  useEffect(() => {
    if (formData.customer_id) {
      filterOrdersByCustomer(formData.customer_id);
    } else {
      // If no customer selected, show all orders
      setOrders(allOrders);
    }
  }, [formData.customer_id, allOrders]);

  return {
    appointments,
    customers,
    orders,
    allOrders,
    today,
    todayAppointments: appointments.filter((a) => a.appointment_date === today),
    loading,
    error,
    formData,
    setFormData,
    filters,
    handleFilterChange,
    clearFilters,  
    fetchAppointments,
    fetchCustomers,
    fetchOrders,
    filterOrdersByCustomer,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    sendReminders,
    reminderStats,
  };
};