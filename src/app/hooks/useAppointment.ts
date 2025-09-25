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

// Enhanced Customer interface
export interface Customer {
  id: number;
  customer_name?: string;
  company_name?: string;
  contact_person?: string;
  customer_type: "individual" | "corporate";
  phone_number?: string;
  email?: string;
  delivery_address?: string;
  special_notes?: string;
  batch_name?: string;
  display_name?: string; // For dropdown display
}

// Enhanced Order interface to handle unique IDs and avoid conflicts
export interface Order {
  id: number | string; // Now accepts both number and string for unique IDs
  order_number: string;
  customer_id: number;
  bulk_id?: string;
  order_type?: string;
  status?: string;
  original_id?: number; // Store order_id (main orders table reference) for backend operations
}

export const useAppointments = (apiEndpoint?: string) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
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

  // Fetch batch information from corporate bulk measurements
  const fetchBatchInformation = async (): Promise<Record<number, string>> => {
    try {
      const possibleEndpoints = [
        `${customerBaseUrl}/corporate-measurement/corporate/all`,
        `${customerBaseUrl}/corporate-bulk-measurements/all`,
        `${customerBaseUrl}/measurements/corporate-bulk/all`,
      ];

      for (const endpoint of possibleEndpoints) {
        try {
          console.log('Trying measurements endpoint:', endpoint);
          const res = await fetch(endpoint, {
            credentials: "include"
          });
          
          if (res.ok) {
            const data = await res.json();
            console.log('Batch measurements response:', data);
            const measurements = data.data || data || [];
            
            // Create mapping of corporate_customer_id to batch_name
            const batchMapping: Record<number, string> = {};
            measurements.forEach((measurement: any) => {
              if (measurement.corporate_customer_id && measurement.batch_name) {
                batchMapping[measurement.corporate_customer_id] = measurement.batch_name;
              }
            });
            
            return batchMapping;
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed:`, err);
        }
      }
    } catch (err) {
      console.error('Error fetching batch information:', err);
    }
    
    return {};
  };

  // Enhanced fetchCustomers with proper display formatting
  const fetchCustomers = async () => {
    try {
      console.log('Fetching customers from:', `${customerBaseUrl}/customer`);
      const res = await fetch(`${customerBaseUrl}/customer`, { 
        credentials: "include" 
      });
      
      if (res.ok) {
        const data = await res.json();
        const customerData = data.data || data;
        
        // Fetch batch information
        const batchInfo = await fetchBatchInformation();
        
        // Transform customer data with proper display names
        const transformedCustomers: Customer[] = customerData.map((customer: any) => {
          const customerId = parseInt(customer.id);
          const customerType = customer.customer_type;
          const batchName = batchInfo[customerId];
          
          let displayName: string;
          
          if (customerType === 'corporate') {
            const companyName = customer.company_name || 'Unknown Company';
            // Format: customer_id-company_name(batch_name)
            displayName = batchName 
              ? `${customerId}-${companyName}(${batchName})`
              : `${customerId}-${companyName}`;
          } else {
            // Individual customers: customer_id-customer_name
            const customerName = customer.customer_name || `Customer ${customerId}`;
            displayName = `${customerId}-${customerName}`;
          }
          
          return {
            id: customerId,
            customer_name: customer.customer_name,
            company_name: customer.company_name,
            contact_person: customer.contact_person,
            customer_type: customerType,
            phone_number: customer.phone_number,
            email: customer.email,
            delivery_address: customer.delivery_address,
            special_notes: customer.special_notes,
            batch_name: batchName,
            display_name: displayName
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

  // Enhanced fetchOrders - fetch from child tables using order_id for backend reference
  const fetchOrders = async () => {
    try {
      console.log('=== FETCHING ORDERS FROM CHILD TABLES ===');
      
      let allOrdersData: Order[] = [];
      
      // Define the different order endpoints with their specific table mappings
      const orderSources = [
        {
          url: `${ordersBaseUrl}/orders/single`,
          type: 'single',
          tableName: 'single_orders',
          prefix: 'S' // Single orders get S- prefix
        },
        {
          url: `${ordersBaseUrl}/orders/bulk-custom`, 
          type: 'bulk-custom',
          tableName: 'bulk_order_custom',
          prefix: 'BC' // Bulk custom orders get BC- prefix
        },
        {
          url: `${ordersBaseUrl}/orders/bulk-default`,
          type: 'bulk-default', 
          tableName: 'bulk_order_default',
          prefix: 'BD' // Bulk default orders get BD- prefix
        }
      ];

      // First, get corporate bulk measurement mapping for bulk custom orders
      let bulkToCustomerMap: Record<string, number> = {};
      try {
        const corporateRes = await fetch(`${customerBaseUrl}/corporate-measurement/corporate/all`, {
          credentials: "include"
        });
        
        if (corporateRes.ok) {
          const corporateData = await corporateRes.json();
          const measurements = corporateData.data || corporateData || [];
          measurements.forEach((measurement: any) => {
            if (measurement.id && measurement.corporate_customer_id) {
              bulkToCustomerMap[String(measurement.id)] = measurement.corporate_customer_id;
            }
          });
          console.log('Corporate bulk ID to customer mapping:', bulkToCustomerMap);
        }
      } catch (error) {
        console.log('Failed to fetch corporate bulk measurements:', error);
      }

      // Fetch from each child table separately
      for (const source of orderSources) {
        try {
          console.log(`\nFetching from ${source.tableName} (${source.type})...`);
          console.log(`URL: ${source.url}`);
          
          const res = await fetch(source.url, { credentials: "include" });
          
          if (res.ok) {
            const data = await res.json();
            console.log(`${source.type} orders response:`, data);
            
            const orderData = Array.isArray(data) ? data : data.data || data.orders || [];
            console.log(`Found ${orderData.length} ${source.type} orders`);
            
            if (orderData.length > 0) {
              console.log(`Sample ${source.type} order:`, orderData[0]);
              
              const transformedOrders: Order[] = orderData
                .filter((order: any) => {
                  const hasId = order.id;
                  if (!hasId) {
                    console.log(`Skipping ${source.type} order without ID:`, order);
                    return false;
                  }
                  return true;
                })
                .map((order: any): Order => {
                  // Create unique ID using prefix to avoid conflicts
                  // Use order_id (main table reference) instead of child table id
                  const uniqueId = `${source.prefix}-${order.order_id}`;
                  let customerId: number = 0;
                  let orderNumber: string = `Order-${order.order_id}`; // Use order_id for display
                  let bulkId: string | undefined;
                  
                  console.log(`Processing ${source.type} order: child_id=${order.id}, order_id=${order.order_id} -> ${uniqueId}`);
                  
                  if (source.type === 'single') {
                    // From single_orders table: has customerid field
                    customerId = order.customerid || 0;
                    orderNumber = `Single-${order.order_id}`;
                    console.log(`  Single order - customerid: ${order.customerid} -> ${customerId}`);
                    
                  } else if (source.type === 'bulk-custom') {
                    // From bulk_order_custom table: resolve customer from Bulkid
                    const bulkIdValue = order.Bulkid;
                    customerId = bulkToCustomerMap[String(bulkIdValue)] || 0;
                    bulkId = bulkIdValue ? String(bulkIdValue) : undefined;
                    orderNumber = `Bulk-Custom-${order.order_id}`;
                    console.log(`  Bulk custom - Bulkid: ${bulkIdValue} -> customer: ${customerId}`);
                    
                  } else if (source.type === 'bulk-default') {
                    // From bulk_order_default table: has CustomerID field
                    customerId = order.CustomerID || 0;
                    orderNumber = `Bulk-Default-${order.order_id}`;
                    console.log(`  Bulk default - CustomerID: ${order.CustomerID} -> ${customerId}`);
                  }
                  
                  const transformedOrder: Order = {
                    id: uniqueId, // Keep as string for unique identification (e.g. "S-15", "BC-23")
                    order_number: orderNumber,
                    customer_id: customerId,
                    bulk_id: bulkId,
                    order_type: source.type,
                    status: order.status,
                    // Store order_id (references main orders table) for backend operations
                    original_id: order.order_id // This matches what appointments table references
                  };
                  
                  console.log(`  Transformed:`, transformedOrder);
                  return transformedOrder;
                })
                .filter((order: Order) => {
                  const isValid = order.customer_id > 0 && order.original_id;
                  if (!isValid) {
                    console.log(`Filtering out order ${order.id} (customer_id: ${order.customer_id}, original_id: ${order.original_id})`);
                  }
                  return isValid;
                });
              
              console.log(`Added ${transformedOrders.length} valid ${source.type} orders`);
              allOrdersData = [...allOrdersData, ...transformedOrders];
            }
            
          } else {
            console.log(`${source.type} endpoint failed: ${res.status} ${res.statusText}`);
            if (res.status === 401) {
              console.log(`Authentication required for ${source.url}`);
            }
          }
          
        } catch (error) {
          console.log(`${source.type} endpoint error:`, error);
        }
      }
      
      console.log(`\nSUMMARY:`);
      console.log(`Total valid orders: ${allOrdersData.length}`);
      console.log(`Order breakdown:`, {
        single: allOrdersData.filter(o => o.order_type === 'single').length,
        'bulk-custom': allOrdersData.filter(o => o.order_type === 'bulk-custom').length,
        'bulk-default': allOrdersData.filter(o => o.order_type === 'bulk-default').length
      });
      
      if (allOrdersData.length > 0) {
        console.log(`Sample orders:`, allOrdersData.slice(0, 3));
      }
      
      setAllOrders(allOrdersData);
      setOrders(allOrdersData);
      
      return { success: true, data: allOrdersData };
      
    } catch (err) {
      console.error("Fatal error fetching orders:", err);
      setOrders([]);
      setAllOrders([]);
      return { success: false, error: `Connection error: ${err}` };
    }
  };

  // Filter orders by selected customer - handle both string and number IDs
  const filterOrdersByCustomer = (customerId: string) => {
    console.log('Filtering orders by customer:', customerId);
    
    if (!customerId) {
      console.log('No customer selected, showing all orders');
      setOrders(allOrders);
      return;
    }
    
    const customerIdNum = parseInt(customerId);
    const selectedCustomer = customers.find(c => c.id === customerIdNum);
    
    if (!selectedCustomer) {
      console.log('Customer not found, clearing orders');
      setOrders([]);
      return;
    }
    
    // Filter orders that belong to the selected customer
    const filteredOrders = allOrders.filter((order: Order) => {
      // Direct customer match
      const directMatch = order.customer_id === customerIdNum;
      
      console.log(`Order ${order.id}: customer_id=${order.customer_id}, selected=${customerIdNum}, match=${directMatch}`);
      
      return directMatch;
    });
    
    console.log(`Found ${filteredOrders.length} orders for customer ${customerIdNum}`);
    setOrders(filteredOrders);
    
    // Clear selected order if it doesn't belong to the customer
    if (formData.order_id) {
      const selectedOrderBelongsToCustomer = filteredOrders.some((order: Order) => 
        String(order.id) === String(formData.order_id)
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
    if (
      !formData.customer_id ||
      !formData.order_id ||
      !formData.appointment_type ||
      !formData.appointment_date ||
      !formData.appointment_time
    ) {
      return { success: false, error: "Please fill all required fields" };
    }

    const customerId = parseInt(formData.customer_id);
    
    // Find the order to get its original_id (order_id) for the backend
    const selectedOrder = allOrders.find(o => String(o.id) === String(formData.order_id));
    if (!selectedOrder || !selectedOrder.original_id) {
      return { success: false, error: "Invalid order selection - order ID not found" };
    }
    
    const orderId = selectedOrder.original_id; // Use order_id for backend
    
    if (isNaN(customerId) || isNaN(orderId)) {
      return { success: false, error: "Invalid customer or order selection" };
    }

    setLoading(true);
    try {
      const payload = {
        customer_id: customerId,  
        order_id: orderId, // Use order_id (main table reference)
        appointment_type: formData.appointment_type,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        status: "scheduled",
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
        return { success: false, error: errorData.message || `Failed to create appointment (HTTP ${res.status})` };
      }

      const createdAppointment = await res.json();
      
      setFormData({
        customer_id: "",
        order_id: "",
        appointment_type: "",
        appointment_date: "",
        appointment_time: "",
        notes: "",
        status: undefined,
      });

      setOrders(allOrders);
      await fetchAppointments();
      return { success: true, data: createdAppointment, message: "Appointment scheduled successfully!" };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create appointment";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateAppointment = async (appointmentId: number, updateData?: Partial<FormData>) => {
    setLoading(true);
    
    try {
      const dataToUse = updateData || formData;
      const existingAppointment = appointments.find(a => a.id === appointmentId);
      
      if (!existingAppointment) {
        return { success: false, error: "Appointment not found" };
      }

      const payload: any = {};
      
      if (dataToUse.appointment_type) payload.appointment_type = dataToUse.appointment_type;
      if (dataToUse.appointment_date) payload.appointment_date = dataToUse.appointment_date;
      if (dataToUse.appointment_time) payload.appointment_time = dataToUse.appointment_time;
      
      if (dataToUse.order_id) {
        // Find the order to get its original_id (order_id) for the backend
        const selectedOrder = allOrders.find(o => String(o.id) === String(dataToUse.order_id));
        if (selectedOrder && selectedOrder.original_id && !isNaN(selectedOrder.original_id)) {
          payload.order_id = selectedOrder.original_id;
        }
      }
      
      if (dataToUse.customer_id) {
        const customerId = parseInt(dataToUse.customer_id);
        if (!isNaN(customerId)) payload.customer_id = customerId;
      }
      if (dataToUse.notes !== undefined) payload.notes = dataToUse.notes || null;
      if (dataToUse.status) payload.status = dataToUse.status;

      if (Object.keys(payload).length === 0) {
        return { success: false, error: "No valid fields to update" };
      }

      const response = await fetch(`${baseUrl}/${appointmentId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const responseData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        return { success: false, error: responseData.detail || responseData.message || `HTTP ${response.status}` };
      }

      await fetchAppointments();
      return { success: true, message: "Appointment updated successfully!" };
    } catch (error) {
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
        return { success: false, error: errorData.message || `Failed to delete appointment (HTTP ${res.status})` };
      }

      await fetchAppointments();
      return { success: true, message: "Appointment deleted successfully!" };
    } catch (err) {
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

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('Loading initial data...');
      
      const customersResult = await fetchCustomers();
      const ordersResult = await fetchOrders();
      const appointmentsResult = await fetchAppointments();
      
      console.log('Initial data loading results:', {
        customers: customersResult.success ? `✅ ${customersResult.data?.length} customers` : `❌ ${customersResult.error}`,
        orders: ordersResult.success ? `✅ ${ordersResult.data?.length} orders` : `❌ ${ordersResult.error}`,
        appointments: appointmentsResult.success ? `✅ Success` : `❌ ${appointmentsResult.error}`
      });
    };
    
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [filters]);

  // Filter orders when customer changes
  useEffect(() => {
    if (formData.customer_id) {
      filterOrdersByCustomer(formData.customer_id);
    } else {
      setOrders(allOrders);
    }
  }, [formData.customer_id, allOrders, customers]);

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
    setOrders, // Add setOrders to the return object
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