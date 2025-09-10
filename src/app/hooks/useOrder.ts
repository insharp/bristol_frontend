import { useState, useCallback } from "react";

// ---------------- ENUMS ----------------
export enum OrderStatus {
  ORDER_CONFIRMED = "order_confirmed",
  FABRIC_READY = "fabric_ready",
  CUTTING = "cutting",
  STITCHING = "stitching",
  FITTING = "fitting",
  READY_FOR_PICKUP = "ready_for_pickup",
  COMPLETED = "completed",
}

// ---------------- TYPES ----------------
export interface Customer {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category_name: string;
}

export interface SingleOrderCreate {
  customerid: number;
  productid: number;
  quantity: number;
  unitprice: number;
  status?: OrderStatus;
  stylepreference?: string;
  speacial_requests?: string;
}

export interface SingleOrderUpdate {
  customerid?: number;
  productid?: number;
  quantity?: number;
  unitprice?: number;
  status?: OrderStatus; // ✅ made optional
  stylepreference?: string;
  speacial_requests?: string;
}

export interface SingleOrderResponse {
  id: number;
  customerid: number;
  productid: number;
  quantity: number;
  unitprice: number;
  status: OrderStatus;
  stylepreference?: string;
  speacial_requests?: string;
  created_at: string;
  updated_at: string;
  mesurement_data?: any[];
}

interface UseOrderState {
  singleOrders: SingleOrderResponse[];
  singleOrder: SingleOrderResponse | null;

  customers: Customer[];
  products: Product[];

  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;

  error: string | null;
}

interface UseOrderActions {
  // Single Orders
  createSingleOrder: (data: SingleOrderCreate) => Promise<SingleOrderResponse | null>;
  getSingleOrder: (id: number) => Promise<SingleOrderResponse | null>;
  getAllSingleOrders: () => Promise<SingleOrderResponse[]>;
  updateSingleOrder: (id: number, data: SingleOrderUpdate) => Promise<SingleOrderResponse | null>;
  deleteSingleOrder: (id: number) => Promise<boolean>;

  // Customers + Products
  fetchCustomers: () => Promise<{ success: boolean; data?: Customer[]; error?: string }>;
  fetchProducts: () => Promise<{ success: boolean; data?: Product[]; error?: string }>;

  // Measurements
  checkMeasurementsExist: (customerId: number, productId: number) => Promise<{ exists: boolean; error?: string }>;

  // Utils
  clearError: () => void;
  clearOrders: () => void;
}

// ---------------- HOOK ----------------
export const useOrder = (
  baseUrl: string = "http://localhost:8000",
  authToken?: string
): UseOrderState & UseOrderActions => {
  const [state, setState] = useState<UseOrderState>({
    singleOrders: [],
    singleOrder: null,
    customers: [],
    products: [],
    loading: false,
    creating: false,
    updating: false,
    deleting: false,
    error: null,
  });

  // 🔑 Request helper
  const makeRequest = useCallback(
    async (
      url: string,
      method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
      body?: any
    ): Promise<any> => {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const config: RequestInit = {
        method,
        headers,
        credentials: "include", // send cookies
      };

      if (body && method !== "GET") config.body = JSON.stringify(body);

      const response = await fetch(`${baseUrl}${url}`, config);

      if (!response.ok) {
        const err = await response.json().catch(() => ({
          detail: "Unknown error occurred",
        }));
        throw new Error(err.detail || `HTTP ${response.status}`);
      }

      return method === "DELETE" ? true : response.json();
    },
    [baseUrl, authToken]
  );

  const handleError = useCallback((error: any) => {
    const msg = error instanceof Error ? error.message : "Unexpected error";
    setState((p) => ({ ...p, error: msg }));
    console.error("Order API error:", error);
  }, []);

  // ---------------- CUSTOMERS ----------------
  const fetchCustomers = useCallback(async () => {
    try {
      setState((p) => ({ ...p, loading: true, error: null }));
      const url = `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}/customer`;

      const res = await fetch(url, { credentials: "include" });

      if (res.ok) {
        const data = await res.json();
        const customerData = data.data || data;

        const transformed: Customer[] = customerData.map((c: any) => ({
          id: parseInt(c.id),
          name:
            c.customer_type === "normal"
              ? c.customer_name
              : `${c.company_name} (${c.contact_person})`,
        }));

        setState((p) => ({ ...p, customers: transformed, loading: false }));
        return { success: true, data: transformed };
      } else {
        throw new Error("Failed to fetch customers");
      }
    } catch (err) {
      handleError(err);
      setState((p) => ({ ...p, customers: [], loading: false }));
      return { success: false, error: "Failed to fetch customers" };
    }
  }, [handleError]);

  // ---------------- PRODUCTS ----------------
  const fetchProducts = useCallback(async () => {
    try {
      setState((p) => ({ ...p, loading: true, error: null }));
      const url = `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}/product`;

      const res = await fetch(url, { credentials: "include" });

      if (res.ok) {
        const data = await res.json();
        const productData = data.data || data;

        const transformed: Product[] = productData.map((p: any) => ({
          id: parseInt(p.id),
          name: p.category_name,
          price: parseFloat(p.base_price),
          category_name: p.category_name,
        }));

        setState((prev) => ({ ...prev, products: transformed, loading: false }));
        return { success: true, data: transformed };
      } else {
        throw new Error("Failed to fetch products");
      }
    } catch (err) {
      handleError(err);
      setState((p) => ({ ...p, products: [], loading: false }));
      return { success: false, error: "Failed to fetch products" };
    }
  }, [handleError]);

  // ---------------- MEASUREMENTS ----------------
  const checkMeasurementsExist = useCallback(async (customerId: number, productId: number) => {
    try {
      const url = `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}/measurement/${customerId}/${productId}`;
      const res = await fetch(url, { credentials: "include" });

      if (res.ok) return { exists: true };
      if (res.status === 404) return { exists: false };

      const errorText = await res.text().catch(() => "Unknown error");
      return { exists: false, error: errorText };
    } catch (err) {
      return { exists: false, error: (err as Error).message };
    }
  }, []);

  // ---------------- SINGLE ORDERS ----------------
  const createSingleOrder = useCallback(async (data: SingleOrderCreate) => {
    try {
      setState((p) => ({ ...p, creating: true, error: null }));
      const order = await makeRequest("/orders/single", "POST", data);
      setState((p) => ({
        ...p,
        singleOrders: [...p.singleOrders, order],
        creating: false,
      }));
      return order;
    } catch (e) {
      handleError(e);
      setState((p) => ({ ...p, creating: false }));
      return null;
    }
  }, [makeRequest, handleError]);

  const getSingleOrder = useCallback(async (id: number) => {
    try {
      setState((p) => ({ ...p, loading: true, error: null }));
      const order = await makeRequest(`/orders/single/${id}`);
      setState((p) => ({ ...p, singleOrder: order, loading: false }));
      return order;
    } catch (e) {
      handleError(e);
      setState((p) => ({ ...p, loading: false }));
      return null;
    }
  }, [makeRequest, handleError]);

  const getAllSingleOrders = useCallback(async () => {
    try {
      setState((p) => ({ ...p, loading: true, error: null }));
      const orders = await makeRequest("/orders/single");
      setState((p) => ({ ...p, singleOrders: orders, loading: false }));
      return orders;
    } catch (e) {
      handleError(e);
      setState((p) => ({ ...p, loading: false }));
      return [];
    }
  }, [makeRequest, handleError]);

  const updateSingleOrder = useCallback(async (id: number, data: SingleOrderUpdate) => {
    try {
      setState((p) => ({ ...p, updating: true, error: null }));
      const updated = await makeRequest(`/orders/single/${id}`, "PUT", data);
      setState((p) => ({
        ...p,
        singleOrders: p.singleOrders.map((o) => (o.id === id ? updated : o)),
        singleOrder: p.singleOrder?.id === id ? updated : p.singleOrder,
        updating: false,
      }));
      return updated;
    } catch (e) {
      handleError(e);
      setState((p) => ({ ...p, updating: false }));
      return null;
    }
  }, [makeRequest, handleError]);

  const deleteSingleOrder = useCallback(async (id: number) => {
    try {
      setState((p) => ({ ...p, deleting: true, error: null }));
      await makeRequest(`/orders/single/${id}`, "DELETE");
      setState((p) => ({
        ...p,
        singleOrders: p.singleOrders.filter((o) => o.id !== id),
        singleOrder: p.singleOrder?.id === id ? null : p.singleOrder,
        deleting: false,
      }));
      return true;
    } catch (e) {
      handleError(e);
      setState((p) => ({ ...p, deleting: false }));
      return false;
    }
  }, [makeRequest, handleError]);

  // ---------------- UTILS ----------------
  const clearError = useCallback(() => setState((p) => ({ ...p, error: null })), []);
  const clearOrders = useCallback(
    () => setState((p) => ({
      ...p,
      singleOrders: [],
      singleOrder: null,
      customers: [],
      products: [],
    })),
    []
  );

  return {
    ...state,
    createSingleOrder,
    getSingleOrder,
    getAllSingleOrders,
    updateSingleOrder,
    deleteSingleOrder,
    fetchCustomers,
    fetchProducts,
    checkMeasurementsExist,
    clearError,
    clearOrders,
  };
};
