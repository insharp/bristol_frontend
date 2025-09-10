import { useState, useCallback } from "react";

// Types based on your FastAPI schemas
export enum OrderStatus {
  ORDER_CONFIRMED = "order_confirmed",
  FABRIC_READY = "fabric_ready",
  CUTTING = "cutting",
  STITCHING = "stitching",
  FITTING = "fitting",
  READY_FOR_PICKUP = "ready_for_pickup",
  COMPLETED = "completed",
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
  status: OrderStatus;
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

export interface BulkOrderCustomCreate {
  Bulkid: number;
  unit_price: number;
  quantity: number;
  status?: OrderStatus;
  stylepreference?: string;
  speacial_requests?: string;
}

export interface BulkOrderCustomUpdate {
  unit_price?: number;
  status: OrderStatus;
  quantity?: number;
  stylepreference?: string;
  speacial_requests?: string;
}

export interface BulkOrderCustomResponse {
  id: number;
  Bulkid: number;
  unit_price: number;
  quantity: number;
  status: OrderStatus;
  stylepreference?: string;
  speacial_requests?: string;
  created_at: string;
  updated_at: string;
  bulk_measurement_data?: any;
}

export interface BulkOrderDefaultCreate {
  CustomerID: number;
  ProductID: number;
  quantity_by_size: Record<string, number>;
  unitprice: number;
  status?: OrderStatus;
  style_preference?: string;
  speacial_request?: string;
}

export interface BulkOrderDefaultUpdate {
  CustomerID?: number;
  ProductID?: number;
  quantity_by_size: Record<string, number>;
  unitprice?: number;
  status: OrderStatus;
  style_preference?: string;
  speacial_request?: string;
}

export interface BulkOrderDefaultResponse {
  id: number;
  CustomerID: number;
  ProductID: number;
  quantity_by_size: Record<string, number>;
  unitprice: number;
  status: OrderStatus;
  style_preference?: string;
  speacial_request?: string;
  created_at: string;
  updated_at: string;
  product_measurements?: any;
}

interface UseOrderState {
  singleOrders: SingleOrderResponse[];
  singleOrder: SingleOrderResponse | null;

  bulkCustomOrders: BulkOrderCustomResponse[];
  bulkCustomOrder: BulkOrderCustomResponse | null;

  bulkDefaultOrders: BulkOrderDefaultResponse[];
  bulkDefaultOrder: BulkOrderDefaultResponse | null;

  customers: { id: number; name: string }[];
  products: { id: number; name: string; price: number; category_name: string }[];

  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;

  error: string | null;
}

interface UseOrderActions {
  // Single
  createSingleOrder: (data: SingleOrderCreate) => Promise<SingleOrderResponse | null>;
  getSingleOrder: (id: number) => Promise<SingleOrderResponse | null>;
  getAllSingleOrders: () => Promise<SingleOrderResponse[]>;
  updateSingleOrder: (id: number, data: SingleOrderUpdate) => Promise<SingleOrderResponse | null>;
  deleteSingleOrder: (id: number) => Promise<boolean>;

  // Bulk Custom
  createBulkCustomOrder: (data: BulkOrderCustomCreate) => Promise<BulkOrderCustomResponse | null>;
  getBulkCustomOrder: (id: number) => Promise<BulkOrderCustomResponse | null>;
  getBulkCustomOrderByBulkId: (bulkId: number) => Promise<BulkOrderCustomResponse | null>;
  getAllBulkCustomOrders: () => Promise<BulkOrderCustomResponse[]>;
  updateBulkCustomOrder: (id: number, data: BulkOrderCustomUpdate) => Promise<BulkOrderCustomResponse | null>;
  deleteBulkCustomOrder: (id: number) => Promise<boolean>;

  // Bulk Default
  createBulkDefaultOrder: (data: BulkOrderDefaultCreate) => Promise<BulkOrderDefaultResponse | null>;
  getBulkDefaultOrder: (id: number) => Promise<BulkOrderDefaultResponse | null>;
  getAllBulkDefaultOrders: () => Promise<BulkOrderDefaultResponse[]>;
  updateBulkDefaultOrder: (id: number, data: BulkOrderDefaultUpdate) => Promise<BulkOrderDefaultResponse | null>;
  deleteBulkDefaultOrder: (id: number) => Promise<boolean>;

  // Customers
  fetchCustomers: () => Promise<{ success: boolean; data?: { id: number; name: string }[]; error?: string }>;
  
  // Products
  fetchProducts: () => Promise<{ success: boolean; data?: { id: number; name: string; price: number; category_name: string }[]; error?: string }>;

  // Measurements
  checkMeasurementsExist: (customerId: number, productId: number) => Promise<{ exists: boolean; error?: string }>;

  // Utils
  clearError: () => void;
  clearOrders: () => void;
}

export const useOrder = (
  baseUrl: string = "http://localhost:8000",
  authToken?: string
): UseOrderState & UseOrderActions => {
  const [state, setState] = useState<UseOrderState>({
    singleOrders: [],
    singleOrder: null,
    bulkCustomOrders: [],
    bulkCustomOrder: null,
    bulkDefaultOrders: [],
    bulkDefaultOrder: null,
    customers: [],
    products: [],
    loading: false,
    creating: false,
    updating: false,
    deleting: false,
    error: null,
  });

  // 🔑 Helper with cookies
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
        credentials: "include", // 🔥 ensure session cookies sent
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

  // Error handler
  const handleError = useCallback((error: any) => {
    const msg = error instanceof Error ? error.message : "Unexpected error";
    setState((p) => ({ ...p, error: msg }));
    console.error("Order API error:", error);
  }, []);

  // ---------------- CUSTOMERS ----------------
  const fetchCustomers = useCallback(async () => {
    try {
      setState((p) => ({ ...p, loading: true, error: null }));
      
      const customerBaseUrl = `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}`;
      
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
        
        setState((p) => ({ 
          ...p, 
          customers: transformedCustomers,
          loading: false 
        }));
        
        return { success: true, data: transformedCustomers };
      } else {
        console.error("Failed to fetch customers");
        setState((p) => ({ 
          ...p, 
          customers: [],
          loading: false,
          error: "Failed to fetch customers"
        }));
        return { success: false, error: "Failed to fetch customers" };
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      const errorMessage = err instanceof Error ? err.message : "Connection error while fetching customers";
      setState((p) => ({ 
        ...p, 
        customers: [],
        loading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // ---------------- PRODUCTS ----------------
  const fetchProducts = useCallback(async () => {
    try {
      setState((p) => ({ ...p, loading: true, error: null }));
      
      const productBaseUrl = `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}`;
      
      const res = await fetch(`${productBaseUrl}/product`, { 
        credentials: "include" 
      });
      
      if (res.ok) {
        const data = await res.json();
        const productData = data.data || data;
        
        // Transform product data to match the expected format
        const transformedProducts = productData.map((product: any) => ({
          id: parseInt(product.id),
          name: product.category_name,
          price: parseFloat(product.base_price),
          category_name: product.category_name
        }));
        
        setState((p) => ({ 
          ...p, 
          products: transformedProducts,
          loading: false 
        }));
        
        return { success: true, data: transformedProducts };
      } else {
        console.error("Failed to fetch products");
        setState((p) => ({ 
          ...p, 
          products: [],
          loading: false,
          error: "Failed to fetch products"
        }));
        return { success: false, error: "Failed to fetch products" };
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      const errorMessage = err instanceof Error ? err.message : "Connection error while fetching products";
      setState((p) => ({ 
        ...p, 
        products: [],
        loading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // ---------------- MEASUREMENTS ----------------
  const checkMeasurementsExist = useCallback(async (customerId: number, productId: number) => {
    try {
      const measurementBaseUrl = `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}`;
      
      const res = await fetch(`${measurementBaseUrl}/measurement/${customerId}/${productId}`, { 
        credentials: "include" 
      });
      
      if (res.ok) {
        // If we get a successful response, measurements exist
        return { exists: true };
      } else if (res.status === 404) {
        // 404 means measurements don't exist
        return { exists: false };
      } else {
        // Other errors
        const errorText = await res.text().catch(() => 'Unknown error');
        return { exists: false, error: `Error checking measurements: ${errorText}` };
      }
    } catch (err) {
      console.error("Error checking measurements:", err);
      const errorMessage = err instanceof Error ? err.message : "Connection error while checking measurements";
      return { exists: false, error: errorMessage };
    }
  }, []);

  // ---------------- SINGLE ----------------
  const createSingleOrder = useCallback(
    async (data: SingleOrderCreate) => {
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
    },
    [makeRequest, handleError]
  );

  const getSingleOrder = useCallback(
    async (id: number) => {
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
    },
    [makeRequest, handleError]
  );

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

  const updateSingleOrder = useCallback(
    async (id: number, data: SingleOrderUpdate) => {
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
    },
    [makeRequest, handleError]
  );

  const deleteSingleOrder = useCallback(
    async (id: number) => {
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
    },
    [makeRequest, handleError]
  );

  // ---------------- BULK CUSTOM ----------------
  const createBulkCustomOrder = useCallback(
    async (data: BulkOrderCustomCreate) => {
      try {
        setState((p) => ({ ...p, creating: true, error: null }));
        const order = await makeRequest("/orders/bulk-custom", "POST", data);
        setState((p) => ({
          ...p,
          bulkCustomOrders: [...p.bulkCustomOrders, order],
          creating: false,
        }));
        return order;
      } catch (e) {
        handleError(e);
        setState((p) => ({ ...p, creating: false }));
        return null;
      }
    },
    [makeRequest, handleError]
  );

  const getBulkCustomOrder = useCallback(
    async (id: number) => {
      try {
        setState((p) => ({ ...p, loading: true, error: null }));
        const order = await makeRequest(`/orders/bulk-custom/${id}`);
        setState((p) => ({ ...p, bulkCustomOrder: order, loading: false }));
        return order;
      } catch (e) {
        handleError(e);
        setState((p) => ({ ...p, loading: false }));
        return null;
      }
    },
    [makeRequest, handleError]
  );

  const getBulkCustomOrderByBulkId = useCallback(
    async (bulkId: number) => {
      try {
        setState((p) => ({ ...p, loading: true, error: null }));
        const order = await makeRequest(`/orders/bulk-custom/by-bulkid/${bulkId}`);
        setState((p) => ({ ...p, bulkCustomOrder: order, loading: false }));
        return order;
      } catch (e) {
        handleError(e);
        setState((p) => ({ ...p, loading: false }));
        return null;
      }
    },
    [makeRequest, handleError]
  );

  const getAllBulkCustomOrders = useCallback(async () => {
    try {
      setState((p) => ({ ...p, loading: true, error: null }));
      const orders = await makeRequest("/orders/bulk-custom");
      setState((p) => ({ ...p, bulkCustomOrders: orders, loading: false }));
      return orders;
    } catch (e) {
      handleError(e);
      setState((p) => ({ ...p, loading: false }));
      return [];
    }
  }, [makeRequest, handleError]);

  const updateBulkCustomOrder = useCallback(
    async (id: number, data: BulkOrderCustomUpdate) => {
      try {
        setState((p) => ({ ...p, updating: true, error: null }));
        const updated = await makeRequest(`/orders/bulk-custom/${id}`, "PUT", data);
        setState((p) => ({
          ...p,
          bulkCustomOrders: p.bulkCustomOrders.map((o) => (o.id === id ? updated : o)),
          bulkCustomOrder: p.bulkCustomOrder?.id === id ? updated : p.bulkCustomOrder,
          updating: false,
        }));
        return updated;
      } catch (e) {
        handleError(e);
        setState((p) => ({ ...p, updating: false }));
        return null;
      }
    },
    [makeRequest, handleError]
  );

  const deleteBulkCustomOrder = useCallback(
    async (id: number) => {
      try {
        setState((p) => ({ ...p, deleting: true, error: null }));
        await makeRequest(`/orders/bulk-custom/${id}`, "DELETE");
        setState((p) => ({
          ...p,
          bulkCustomOrders: p.bulkCustomOrders.filter((o) => o.id !== id),
          bulkCustomOrder: p.bulkCustomOrder?.id === id ? null : p.bulkCustomOrder,
          deleting: false,
        }));
        return true;
      } catch (e) {
        handleError(e);
        setState((p) => ({ ...p, deleting: false }));
        return false;
      }
    },
    [makeRequest, handleError]
  );

  // ---------------- BULK DEFAULT ----------------
  const createBulkDefaultOrder = useCallback(
    async (data: BulkOrderDefaultCreate) => {
      try {
        setState((p) => ({ ...p, creating: true, error: null }));
        const order = await makeRequest("/orders/bulk-default", "POST", data);
        setState((p) => ({
          ...p,
          bulkDefaultOrders: [...p.bulkDefaultOrders, order],
          creating: false,
        }));
        return order;
      } catch (e) {
        handleError(e);
        setState((p) => ({ ...p, creating: false }));
        return null;
      }
    },
    [makeRequest, handleError]
  );

  const getBulkDefaultOrder = useCallback(
    async (id: number) => {
      try {
        setState((p) => ({ ...p, loading: true, error: null }));
        const order = await makeRequest(`/orders/bulk-default/${id}`);
        setState((p) => ({ ...p, bulkDefaultOrder: order, loading: false }));
        return order;
      } catch (e) {
        handleError(e);
        setState((p) => ({ ...p, loading: false }));
        return null;
      }
    },
    [makeRequest, handleError]
  );

  const getAllBulkDefaultOrders = useCallback(async () => {
    try {
      setState((p) => ({ ...p, loading: true, error: null }));
      const orders = await makeRequest("/orders/bulk-default");
      setState((p) => ({ ...p, bulkDefaultOrders: orders, loading: false }));
      return orders;
    } catch (e) {
      handleError(e);
      setState((p) => ({ ...p, loading: false }));
      return [];
    }
  }, [makeRequest, handleError]);

  const updateBulkDefaultOrder = useCallback(
    async (id: number, data: BulkOrderDefaultUpdate) => {
      try {
        setState((p) => ({ ...p, updating: true, error: null }));
        const updated = await makeRequest(`/orders/bulk-default/${id}`, "PUT", data);
        setState((p) => ({
          ...p,
          bulkDefaultOrders: p.bulkDefaultOrders.map((o) => (o.id === id ? updated : o)),
          bulkDefaultOrder: p.bulkDefaultOrder?.id === id ? updated : p.bulkDefaultOrder,
          updating: false,
        }));
        return updated;
      } catch (e) {
        handleError(e);
        setState((p) => ({ ...p, updating: false }));
        return null;
      }
    },
    [makeRequest, handleError]
  );

  const deleteBulkDefaultOrder = useCallback(
    async (id: number) => {
      try {
        setState((p) => ({ ...p, deleting: true, error: null }));
        await makeRequest(`/orders/bulk-default/${id}`, "DELETE");
        setState((p) => ({
          ...p,
          bulkDefaultOrders: p.bulkDefaultOrders.filter((o) => o.id !== id),
          bulkDefaultOrder: p.bulkDefaultOrder?.id === id ? null : p.bulkDefaultOrder,
          deleting: false,
        }));
        return true;
      } catch (e) {
        handleError(e);
        setState((p) => ({ ...p, deleting: false }));
        return false;
      }
    },
    [makeRequest, handleError]
  );

  // ---------------- UTILS ----------------
  const clearError = useCallback(() => setState((p) => ({ ...p, error: null })), []);
  const clearOrders = useCallback(
    () =>
      setState((p) => ({
        ...p,
        singleOrders: [],
        singleOrder: null,
        bulkCustomOrders: [],
        bulkCustomOrder: null,
        bulkDefaultOrders: [],
        bulkDefaultOrder: null,
        customers: [],
        products: [],
      })),
    []
  );

 return {
    // State
    ...state,
    
    // Single Order Actions
    createSingleOrder,
    getSingleOrder,
    getAllSingleOrders,
    updateSingleOrder,
    deleteSingleOrder,
    
    // Bulk Custom Order Actions
    createBulkCustomOrder,
    getBulkCustomOrder,
    getBulkCustomOrderByBulkId,
    getAllBulkCustomOrders,
    updateBulkCustomOrder,
    deleteBulkCustomOrder,
    
    // Bulk Default Order Actions
    createBulkDefaultOrder,
    getBulkDefaultOrder,
    getAllBulkDefaultOrders,
    updateBulkDefaultOrder,
    deleteBulkDefaultOrder,
    
    // Customer Actions
    fetchCustomers,
    
    // Product Actions
    fetchProducts,
    
    // Measurement Actions
    checkMeasurementsExist,
    
    // Utility actions
    clearError,
    clearOrders,
  };
};