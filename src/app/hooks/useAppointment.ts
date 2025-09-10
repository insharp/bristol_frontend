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

export const useAppointments = (apiEndpoint?: string) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);
  const [orders, setOrders] = useState<{ id: number; order_number: string }[]>([]);
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

  const baseUrl = apiEndpoint || `http://localhost:8000/appointment`;
  const customerBaseUrl = `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}`;
  const today = new Date().toISOString().split("T")[0];

  // Fetch customers from database
  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${customerBaseUrl}/customer`, { 
        credentials: "include" 
      });
      
      if (res.ok) {
        const data = await res.json();
        const customerData = data.data || data;
        
        // Transform customer data to match the expected format
        const transformedCustomers = customerData.map((customer: any) => ({
          id: parseInt(customer.id),
          name: customer.customer_type === 'normal' 
            ? customer.customer_name 
            : `${customer.company_name} (${customer.contact_person})`
        }));
        
        setCustomers(transformedCustomers);
        return { success: true, data: transformedCustomers };
      } else {
        console.error("Failed to fetch customers");
        setCustomers([]);
        return { success: false, error: "Failed to fetch customers" };
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      setCustomers([]);
      return { success: false, error: "Connection error while fetching customers" };
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

  useEffect(() => {
    // Fetch customers from database
    fetchCustomers();
    
    // Fetch appointments
    fetchAppointments();
    
    // Keep orders as mock data for now
    setOrders([
      { id: 1, order_number: "ORD-001" },
      { id: 2, order_number: "ORD-002" },
      { id: 3, order_number: "ORD-003" },
    ]);
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [filters]);

  return {
    appointments,
    customers,
    orders,
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
    createAppointment,
    updateAppointment,
    deleteAppointment,
    sendReminders,
    reminderStats,
  };
};