import { useState, useEffect } from "react";

// ---------------------
// Interfaces
// ---------------------
export interface BaseSingleOrder {
  id: number;
  customer_id: number;
  order_type: "single";
  product: string;
  quantity: number;
  unit_price: number;
  style_preferences?: string;
  special_notes?: string;
  status: string; // order confirmed, cutting, ready to pickup, etc.
}

export interface SingleOrder extends BaseSingleOrder {
  customer_name?: string;
  product_name?: string;
}

export interface Filters {
  customer_id?: number;
  product?: string;
  status?: string;
  search?: string;
  skip?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface FormData {
  customer_id: string;
  order_type: "single";
  product: string;
  quantity: string;
  unit_price: string;
  style_preferences: string;
  special_notes: string;
  status?: string;
}

// ---------------------
// Hook
// ---------------------
export const useSingleOrders = (apiEndpoint?: string) => {
  const [orders, setOrders] = useState<SingleOrder[]>([]);
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    customer_id: "",
    order_type: "single",
    product: "",
    quantity: "",
    unit_price: "",
    style_preferences: "",
    special_notes: "",
    status: undefined,
  });

  const [filters, setFilters] = useState<Filters>({
    customer_id: undefined,
    product: undefined,
    status: undefined,
    search: undefined,
    skip: 0,
    limit: 50,
    sort_by: "id",
    sort_order: "desc",
  });

  const baseUrl = apiEndpoint || `http://localhost:8000/orders/single`;
  const customerBaseUrl = `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}`;

  // ---------------------
  // Fetch Customers
  // ---------------------
  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${customerBaseUrl}/customer`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const customerData = data.data || data;

        const transformed = customerData.map((c: any) => ({
          id: parseInt(c.id),
          name: c.customer_type === "normal" ? c.customer_name : `${c.company_name} (${c.contact_person})`,
        }));

        setCustomers(transformed);
        return { success: true, data: transformed };
      }
      return { success: false, error: "Failed to fetch customers" };
    } catch (err) {
      console.error("Fetch customers error:", err);
      return { success: false, error: "Connection error" };
    }
  };

  // ---------------------
  // Fetch Orders
  // ---------------------
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== "") params.append(k, v.toString());
      });

      const res = await fetch(`${baseUrl}/?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: SingleOrder[] = await res.json();
      setOrders(data);
      return { success: true, data };
    } catch (err) {
      console.error(err);
      setError("Failed to fetch orders");
      return { success: false, error: "Failed to fetch orders" };
    } finally {
      setLoading(false);
    }
  };

  // ---------------------
  // Create Order
  // ---------------------
  const createOrder = async () => {
    if (!formData.customer_id || !formData.product || !formData.quantity || !formData.unit_price) {
      return { success: false, error: "Please fill all required fields" };
    }

    const payload = {
      customer_id: parseInt(formData.customer_id),
      order_type: "single",
      product: formData.product,
      quantity: parseInt(formData.quantity),
      unit_price: parseFloat(formData.unit_price),
      style_preferences: formData.style_preferences || null,
      special_notes: formData.special_notes || null,
      status: formData.status || "order confirmed",
    };

    try {
      const res = await fetch(`${baseUrl}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        return { success: false, error: errorData.message || "Failed to create order" };
      }

      const created = await res.json();
      await fetchOrders();

      setFormData({
        customer_id: "",
        order_type: "single",
        product: "",
        quantity: "",
        unit_price: "",
        style_preferences: "",
        special_notes: "",
        status: undefined,
      });

      return { success: true, data: created, message: "Order created successfully!" };
    } catch (err) {
      console.error("Create order error:", err);
      return { success: false, error: "Failed to create order" };
    }
  };

  // ---------------------
  // Update Order
  // ---------------------
  const updateOrder = async (orderId: number, updateData?: Partial<FormData>) => {
    const dataToUse = updateData || formData;

    const payload: any = {};
    if (dataToUse.product) payload.product = dataToUse.product;
    if (dataToUse.quantity) payload.quantity = parseInt(dataToUse.quantity);
    if (dataToUse.unit_price) payload.unit_price = parseFloat(dataToUse.unit_price);
    if (dataToUse.style_preferences !== undefined) payload.style_preferences = dataToUse.style_preferences;
    if (dataToUse.special_notes !== undefined) payload.special_notes = dataToUse.special_notes;
    if (dataToUse.status) payload.status = dataToUse.status;

    try {
      const res = await fetch(`${baseUrl}/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        return { success: false, error: errorData.message || "Failed to update order" };
      }

      const updated = await res.json();
      await fetchOrders();
      return { success: true, data: updated, message: "Order updated successfully!" };
    } catch (err) {
      console.error("Update order error:", err);
      return { success: false, error: "Failed to update order" };
    }
  };

  // ---------------------
  // Delete Order
  // ---------------------
  const deleteOrder = async (orderId: number) => {
    try {
      const res = await fetch(`${baseUrl}/${orderId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        return { success: false, error: errorData.message || "Failed to delete order" };
      }

      await fetchOrders();
      return { success: true, message: "Order deleted successfully!" };
    } catch (err) {
      console.error("Delete order error:", err);
      return { success: false, error: "Failed to delete order" };
    }
  };

  // ---------------------
  // Filters
  // ---------------------
  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, skip: 0 }));
  };

  const clearFilters = () => {
    setFilters({
      customer_id: undefined,
      product: undefined,
      status: undefined,
      search: undefined,
      skip: 0,
      limit: 50,
      sort_by: "id",
      sort_order: "desc",
    });
  };

  // ---------------------
  // Effects
  // ---------------------
  useEffect(() => {
    fetchCustomers();
    fetchOrders();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  // ---------------------
  // Return
  // ---------------------
  return {
    orders,
    customers,
    loading,
    error,
    formData,
    setFormData,
    filters,
    handleFilterChange,
    clearFilters,
    fetchOrders,
    fetchCustomers,
    createOrder,
    updateOrder,
    deleteOrder,
    
  };
};
