// hooks/useOrderManagement.ts
import { useState, useCallback, useEffect } from 'react';

// Types based on your schemas
export enum OrderStatus {
  ORDER_CONFIREMED = "order_confirmed", // Backend has this typo in enum name but correct value
  FABRIC_READY = "fabric_ready",
  CUTTING = "cutting", 
  STITCHING = "stitching",
  FITTING = "fitting",
  READY_FOR_PICKUP = "ready_for_pickup",
  COMPLETED = "completed"
}

export enum CustomerType {
  NORMAL = "individual",
  CORPORATE = "corporate"
}

export enum SizeTypeEnum {
  XXS = "double_extra_small",
  XS = "extra_small", 
  S = "small",
  M = "medium",
  L = "large",
  XL = "extra_large",
  XXL = "double_large"
}

// Customer Types
export interface Customer {
  id: number;
  customer_name?: string;
  company_name?: string;
  contact_person?: string;
  customer_type: CustomerType;
  phone_number: string;
  email?: string;
  delivery_address?: string;
  special_notes?: string;
  created_at: string;
  updated_at: string;
}

// Product Types
export interface Product {
  id: number;
  category_name: string;
  base_price: number;
  description?: string;
  style_option?: string;
  comments?: string;
  created_at: string;
  updated_at: string;
}

// Measurement Types
export interface MeasurementField {
  id: number;
  product_id: number;
  field_name: string;
  field_type: string;
  unit: string;
  is_required: string;
  created_at: string;
  updated_at: string;
}

// Bulk ID Data interface
interface BulkIdData {
  id: number;
  batch_name?: string;
  corporate_customer_id: number;
  corporate_customer_name?: string;
  product_id: number;
  product_name: string;
  created_at: string;
}

export interface CustomerMeasurementGroupedResponse {
  customer_id: number;
  customer_name: string;
  product_id: number;
  product_name: string;
  measurements: Array<{
    field_id: number;
    field_name: string;
    value: string;
    unit: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface EmployeeMeasurementResponse {
  id: number;
  employee_code: string;
  employee_name?: string;
  measurements: Array<{
    field_id: number;
    field_name: string;
    value: string;
    unit: string;
  }>;
}

export interface CorporateBulkMeasurementResponse {
  id: number;
  corporate_customer_id: number;
  corporate_customer_name?: string;
  product_id: number;
  product_name: string;
  batch_name?: string;
  employees: EmployeeMeasurementResponse[];
  created_at: string;
  updated_at: string;
}

export interface ProductMeasurementResponse {
  id: number;
  product_id: number;
  product_name: string;
  size: string;
  measurements: Array<{
    field_id: number;
    field_name: string;
    value: string;
    unit: string;
  }>;
  created_at: string;
  updated_at: string;
}

// Single Order Types
export interface SingleOrderCreate {
  customerid: number;
  productid: number;
  quantity: number;
  unitprice: number;
  status?: OrderStatus;
  stylepreference?: string;
  speacial_requests?: string; // Backend has this typo
}

export interface SingleOrderUpdate {
  customerid?: number;
  productid?: number;
  quantity?: number;
  unitprice?: number;
  status: OrderStatus;
  stylepreference?: string;
  speacial_requests?: string; // Backend has this typo
}

export interface SingleOrderResponse {
  id: number;
  customerid: number;
  productid: number;
  quantity: number;
  unitprice: number;
  status: OrderStatus;
  stylepreference?: string;
  speacial_requests?: string; // Backend has this typo
  created_at: string;
  updated_at: string;
}

// Bulk Custom Order Types
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
  bulk_measurement_data?: Record<string, any>;
  customer_id?: number;
  customer_name?: string;
  product_id?: number;
  product_name?: string;
  batch_name?: string; // Add batch_name property
}

// Bulk Default Order Types
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
  product_measurements?: Record<string, any>;
}

// API Error Response
interface ApiError {
  detail: string;
}

// Hook state interface
interface OrderState {
  loading: boolean;
  error: string | null;
}

interface DropdownData {
  customers: Customer[];
  products: Product[];
  customersLoading: boolean;
  productsLoading: boolean;
  customersError: string | null;
  productsError: string | null;
}

interface MeasurementData {
  measurementFields: MeasurementField[];
  customerMeasurements: CustomerMeasurementGroupedResponse[];
  corporateBulkMeasurements: CorporateBulkMeasurementResponse[];
  productMeasurements: ProductMeasurementResponse[];
  measurementsLoading: boolean;
  measurementsError: string | null;
}

// Base API URL - adjust as needed
const API_BASE_URL = 'http://localhost:8000';

// Utility function to get request headers with session cookies
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  // Session cookies are automatically included with credentials: 'include'
});

// Utility function to handle API calls with session cookies
const handleApiCall = async <T>(
  apiCall: () => Promise<Response>,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
): Promise<T | null> => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await apiCall();
    
    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    // Handle 204 No Content for delete operations
    if (response.status === 204) {
      setLoading(false);
      return null;
    }
    
    const data = await response.json();
    setLoading(false);
    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    setLoading(false);
    setError(errorMessage);
    throw error;
  }
};

// Hook for fetching dropdown data (customers and products)
export const useDropdownData = () => {
  const [dropdownData, setDropdownData] = useState<DropdownData>({
    customers: [],
    products: [],
    customersLoading: false,
    productsLoading: false,
    customersError: null,
    productsError: null,
  });

  const fetchCustomers = useCallback(async () => {
    await handleApiCall(
      () => fetch(`${API_BASE_URL}/customer/`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include', // Include session cookies
      }),
      (loading) => setDropdownData(prev => ({ ...prev, customersLoading: loading })),
      (error) => setDropdownData(prev => ({ ...prev, customersError: error }))
    ).then(data => {
        if (data && Array.isArray(data)) {
      setDropdownData(prev => ({ ...prev, customers: data as Customer[] }));
      }
    }).catch(() => {
      // Error already handled in handleApiCall
    });
  }, []);

  const fetchProducts = useCallback(async () => {
    await handleApiCall(
      () => fetch(`${API_BASE_URL}/product/`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include', // Include session cookies
      }),
      (loading) => setDropdownData(prev => ({ ...prev, productsLoading: loading })),
      (error) => setDropdownData(prev => ({ ...prev, productsError: error }))
    ).then(data => {
     if (data && Array.isArray(data)) {
 setDropdownData(prev => ({ ...prev, products: data as Product[] }));
}
    }).catch(() => {
      // Error already handled in handleApiCall
    });
  }, []);

  const refreshDropdownData = useCallback(async () => {
    await Promise.all([fetchCustomers(), fetchProducts()]);
  }, [fetchCustomers, fetchProducts]);

  // Auto-fetch on hook initialization
  useEffect(() => {
    refreshDropdownData();
  }, [refreshDropdownData]);

  return {
    ...dropdownData,
    fetchCustomers,
    fetchProducts,
    refreshDropdownData,
  };
};

// Measurement Management Hook
export const useMeasurements = () => {
  const [measurementData, setMeasurementData] = useState<MeasurementData>({
    measurementFields: [],
    customerMeasurements: [],
    corporateBulkMeasurements: [],
    productMeasurements: [],
    measurementsLoading: false,
    measurementsError: null,
  });

  const setLoading = (loading: boolean) => 
    setMeasurementData(prev => ({ ...prev, measurementsLoading: loading }));
  const setError = (error: string | null) => 
    setMeasurementData(prev => ({ ...prev, measurementsError: error }));

  // Measurement Fields
  const getAllMeasurementFields = useCallback(async (): Promise<MeasurementField[] | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/measurement-fields/measurements/all`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      setLoading,
      setError
    );
  }, []);

  const getMeasurementFieldsByProduct = useCallback(async (productId: number): Promise<MeasurementField[] | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/measurement-fields/product/${productId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      setLoading,
      setError
    );
  }, []);

  // Customer Measurements
  const getAllCustomerMeasurements = useCallback(async (): Promise<CustomerMeasurementGroupedResponse[] | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/customer-measurement/customer/all`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      setLoading,
      setError
    );
  }, []);

  const getCustomerMeasurements = useCallback(async (customerId: number): Promise<CustomerMeasurementGroupedResponse[] | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/customer-measurement/customer/${customerId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      setLoading,
      setError
    );
  }, []);

  const getCustomerProductMeasurements = useCallback(async (customerId: number, productId: number): Promise<CustomerMeasurementGroupedResponse | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/customer-measurement/customer/${customerId}/product/${productId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      setLoading,
      setError
    );
  }, []);

  // Corporate Bulk Measurements - Updated to include bulk ID and batch name
  const getAllCorporateBulkMeasurements = useCallback(async (): Promise<CorporateBulkMeasurementResponse[] | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/corporate-measurement/corporate/all`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      setLoading,
      setError
    );
  }, []);

  const getCorporateBulkMeasurement = useCallback(async (bulkId: number): Promise<CorporateBulkMeasurementResponse | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/corporate-measurement/${bulkId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      setLoading,
      setError
    );
  }, []);

  const getCorporateCustomerMeasurements = useCallback(async (customerId: number): Promise<CorporateBulkMeasurementResponse[] | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/corporate-measurement/customer/${customerId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      setLoading,
      setError
    );
  }, []);

  // Product Measurements
  const getAllProductMeasurements = useCallback(async (): Promise<ProductMeasurementResponse[] | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/product-measurements/`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      setLoading,
      setError
    );
  }, []);

  const getProductMeasurement = useCallback(async (measurementId: number): Promise<ProductMeasurementResponse | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/product-measurement/${measurementId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      setLoading,
      setError
    );
  }, []);

  const getProductMeasurementsBySize = useCallback(async (productId: number, size: string): Promise<ProductMeasurementResponse | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/product-measurement/product/${productId}/size/${size}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      setLoading,
      setError
    );
  }, []);

  // Helper function to get bulk measurement by ID with batch name
  const getBulkMeasurementWithBatchName = useCallback(async (bulkId: number): Promise<{
    id: number;
    batch_name?: string;
    corporate_customer_name?: string;
    product_name: string;
    employees: EmployeeMeasurementResponse[];
  } | null> => {
    const measurement = await getCorporateBulkMeasurement(bulkId);
    if (measurement) {
      return {
        id: measurement.id,
        batch_name: measurement.batch_name,
        corporate_customer_name: measurement.corporate_customer_name,
        product_name: measurement.product_name,
        employees: measurement.employees
      };
    }
    return null;
  }, [getCorporateBulkMeasurement]);

  return {
    ...measurementData,
    // Measurement Fields
    getAllMeasurementFields,
    getMeasurementFieldsByProduct,
    // Customer Measurements
    getAllCustomerMeasurements,
    getCustomerMeasurements,
    getCustomerProductMeasurements,
    // Corporate Bulk Measurements
    getAllCorporateBulkMeasurements,
    getCorporateBulkMeasurement,
    getCorporateCustomerMeasurements,
    getBulkMeasurementWithBatchName, // New helper function
    // Product Measurements
    getAllProductMeasurements,
    getProductMeasurement,
    getProductMeasurementsBySize,
  };
};

// Single Order Management Hook
export const useSingleOrders = () => {
  const [state, setState] = useState<OrderState>({ loading: false, error: null });

  const setLoading = (loading: boolean) => setState(prev => ({ ...prev, loading }));
  const setError = (error: string | null) => setState(prev => ({ ...prev, error }));

  const createSingleOrder = useCallback(async (orderData: SingleOrderCreate): Promise<SingleOrderResponse | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/orders/single`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(orderData),
      }),
      setLoading,
      setError
    );
  }, []);

  const getSingleOrder = useCallback(async (orderId: number): Promise<SingleOrderResponse | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/orders/single/${orderId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      setLoading,
      setError
    );
  }, []);

  const getAllSingleOrders = useCallback(async (): Promise<SingleOrderResponse[] | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/orders/single`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      setLoading,
      setError
    );
  }, []);

  const updateSingleOrder = useCallback(async (orderId: number, orderData: SingleOrderUpdate): Promise<SingleOrderResponse | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/orders/single/${orderId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(orderData),
      }),
      setLoading,
      setError
    );
  }, []);

  const deleteSingleOrder = useCallback(async (orderId: number): Promise<void> => {
    await handleApiCall(
      () => fetch(`${API_BASE_URL}/orders/single/${orderId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      setLoading,
      setError
    );
  }, []);

  return {
    ...state,
    createSingleOrder,
    getSingleOrder,
    getAllSingleOrders,
    updateSingleOrder,
    deleteSingleOrder,
  };
};

// Updated Bulk Custom Order Management Hook with Bulk ID functionality
export const useBulkCustomOrders = () => {
  const [state, setState] = useState<OrderState>({ loading: false, error: null });
  
  // Add bulk ID state
  const [bulkIds, setBulkIds] = useState<BulkIdData[]>([]);
  const [bulkIdsLoading, setBulkIdsLoading] = useState(false);
  const [bulkIdsError, setBulkIdsError] = useState<string | null>(null);

  const setLoading = (loading: boolean) => setState(prev => ({ ...prev, loading }));
  const setError = (error: string | null) => setState(prev => ({ ...prev, error }));

  // Add function to fetch all bulk IDs
  const getAllBulkIds = useCallback(async (): Promise<BulkIdData[] | null> => {
    setBulkIdsLoading(true);
    setBulkIdsError(null);
    
    try {
      const corporateMeasurements = await handleApiCall(
        () => fetch(`${API_BASE_URL}/corporate-measurement/corporate/all`, {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        }),
        () => {}, // Empty function since we're handling loading manually
        (error) => setBulkIdsError(error)
      );

      if (corporateMeasurements && Array.isArray(corporateMeasurements)) {
        const bulkIdData: BulkIdData[] = corporateMeasurements.map((measurement: any) => ({
          id: measurement.id, // This is the bulk_id
          batch_name: measurement.batch_name,
          corporate_customer_id: measurement.corporate_customer_id,
          corporate_customer_name: measurement.corporate_customer_name,
          product_id: measurement.product_id,
          product_name: measurement.product_name,
          created_at: measurement.created_at
        }));
        
        setBulkIds(bulkIdData);
        setBulkIdsLoading(false);
        return bulkIdData;
      }
      
      setBulkIdsLoading(false);
      return null;
    } catch (error) {
      setBulkIdsError(error instanceof Error ? error.message : 'Failed to fetch bulk IDs');
      setBulkIdsLoading(false);
      return null;
    }
  }, []);

  const createBulkCustomOrder = useCallback(async (orderData: BulkOrderCustomCreate): Promise<BulkOrderCustomResponse | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/orders/bulk-custom`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(orderData),
      }),
      setLoading,
      setError
    );
  }, []);

  const getBulkCustomOrder = useCallback(async (orderId: number): Promise<BulkOrderCustomResponse | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/orders/bulk-custom/${orderId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      setLoading,
      setError
    );
  }, []);

  const getBulkCustomOrderByBulkId = useCallback(async (bulkId: number): Promise<BulkOrderCustomResponse | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/orders/bulk-custom/by-bulkid/${bulkId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      setLoading,
      setError
    );
  }, []);

  const getAllBulkCustomOrders = useCallback(async (): Promise<BulkOrderCustomResponse[] | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/orders/bulk-custom`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      setLoading,
      setError
    );
  }, []);

  const updateBulkCustomOrder = useCallback(async (orderId: number, orderData: BulkOrderCustomUpdate): Promise<BulkOrderCustomResponse | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/orders/bulk-custom/${orderId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(orderData),
      }),
      setLoading,
      setError
    );
  }, []);

  const deleteBulkCustomOrder = useCallback(async (orderId: number): Promise<void> => {
    await handleApiCall(
      () => fetch(`${API_BASE_URL}/orders/bulk-custom/${orderId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      setLoading,
      setError
    );
  }, []);

  // Update the return object to include bulk ID functionality
  return {
    ...state,
    createBulkCustomOrder,
    getBulkCustomOrder,
    getBulkCustomOrderByBulkId,
    getAllBulkCustomOrders,
    updateBulkCustomOrder,
    deleteBulkCustomOrder,
    // Add bulk ID properties
    getAllBulkIds,
    bulkIds,
    bulkIdsLoading,
    bulkIdsError,
  };
};

// Bulk Default Order Management Hook
export const useBulkDefaultOrders = () => {
  const [state, setState] = useState<OrderState>({ loading: false, error: null });

  const setLoading = (loading: boolean) => setState(prev => ({ ...prev, loading }));
  const setError = (error: string | null) => setState(prev => ({ ...prev, error }));

  const createBulkDefaultOrder = useCallback(async (orderData: BulkOrderDefaultCreate): Promise<BulkOrderDefaultResponse | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/orders/bulk-default`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(orderData),
      }),
      setLoading,
      setError
    );
  }, []);

  const getBulkDefaultOrder = useCallback(async (orderId: number): Promise<BulkOrderDefaultResponse | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/orders/bulk-default/${orderId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      setLoading,
      setError
    );
  }, []);

  const getAllBulkDefaultOrders = useCallback(async (): Promise<BulkOrderDefaultResponse[] | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/orders/bulk-default`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      setLoading,
      setError
    );
  }, []);

  const updateBulkDefaultOrder = useCallback(async (orderId: number, orderData: BulkOrderDefaultUpdate): Promise<BulkOrderDefaultResponse | null> => {
    return handleApiCall(
      () => fetch(`${API_BASE_URL}/orders/bulk-default/${orderId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(orderData),
      }),
      setLoading,
      setError
    );
  }, []);

  const deleteBulkDefaultOrder = useCallback(async (orderId: number): Promise<void> => {
    await handleApiCall(
      () => fetch(`${API_BASE_URL}/orders/bulk-default/${orderId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      setLoading,
      setError
    );
  }, []);

  return {
    ...state,
    createBulkDefaultOrder,
    getBulkDefaultOrder,
    getAllBulkDefaultOrders,
    updateBulkDefaultOrder,
    deleteBulkDefaultOrder,
  };
};

// Combined hook for all order management operations
export const useOrderManagement = () => {
  const singleOrders = useSingleOrders();
  const bulkCustomOrders = useBulkCustomOrders();
  const bulkDefaultOrders = useBulkDefaultOrders();
  const dropdownData = useDropdownData();
  const measurements = useMeasurements();

  // Utility function to get customer display name
  const getCustomerDisplayName = useCallback((customer: Customer): string => {
    if (customer.customer_type === CustomerType.CORPORATE) {
      return customer.company_name || `Corporate Customer ${customer.id}`;
    }
    return customer.customer_name || `Customer ${customer.id}`;
  }, []);

  // Utility function to get product display name
  const getProductDisplayName = useCallback((product: Product): string => {
    return `${product.category_name} - ${product.base_price}`;
  }, []);

  // Get customer by ID
  const getCustomerById = useCallback((customerId: number): Customer | undefined => {
    return dropdownData.customers.find(customer => customer.id === customerId);
  }, [dropdownData.customers]);

  // Get product by ID
  const getProductById = useCallback((productId: number): Product | undefined => {
    return dropdownData.products.find(product => product.id === productId);
  }, [dropdownData.products]);

  // Filter customers by type
  const getCustomersByType = useCallback((type: CustomerType): Customer[] => {
    return dropdownData.customers.filter(customer => customer.customer_type === type);
  }, [dropdownData.customers]);

  // Get products by category
  const getProductsByCategory = useCallback((categoryName: string): Product[] => {
    return dropdownData.products.filter(product => 
      product.category_name.toLowerCase().includes(categoryName.toLowerCase())
    );
  }, [dropdownData.products]);

  // Update the enrichBulkCustomOrders function to include batch name
// Update the enrichBulkCustomOrders function to be safe
const enrichBulkCustomOrders = useCallback(async (orders: BulkOrderCustomResponse[]): Promise<BulkOrderCustomResponse[]> => {
  return Promise.all(
    orders.map(async (order) => {
      let bulkMeasurement = null;
      try {
        bulkMeasurement = await measurements.getCorporateBulkMeasurement(order.Bulkid);
      } catch (error) {
        console.warn(`Bulk data missing for Bulk ID ${order.Bulkid}:`, error);
      }

      return {
        ...order,
        customer_id: bulkMeasurement?.corporate_customer_id ?? order.customer_id,
        customer_name: bulkMeasurement?.corporate_customer_name ?? order.customer_name,
        batch_name: bulkMeasurement?.batch_name ?? order.batch_name,
        product_id: bulkMeasurement?.product_id ?? order.product_id,
        product_name: bulkMeasurement?.product_name ?? order.product_name,
      };
    })
  );
}, [measurements]);

  return {
    // Individual hooks
    singleOrders,
    bulkCustomOrders,
    bulkDefaultOrders,
    dropdownData,
    measurements,
    
    // Utility functions
    getCustomerDisplayName,
    getProductDisplayName,
    getCustomerById,
    getProductById,
    getCustomersByType,
    getProductsByCategory,
    enrichBulkCustomOrders,
    
    // Combined loading state - updated to include bulk IDs loading
    isLoading: singleOrders.loading || bulkCustomOrders.loading || bulkDefaultOrders.loading || 
               dropdownData.customersLoading || dropdownData.productsLoading || measurements.measurementsLoading ||
               bulkCustomOrders.bulkIdsLoading,
    
    // Combined error state - updated to include bulk IDs error
    hasError: !!(singleOrders.error || bulkCustomOrders.error || bulkDefaultOrders.error || 
                 dropdownData.customersError || dropdownData.productsError || measurements.measurementsError ||
                 bulkCustomOrders.bulkIdsError),
    
    // All errors combined - updated to include bulk IDs error
    errors: {
      singleOrders: singleOrders.error,
      bulkCustomOrders: bulkCustomOrders.error,
      bulkDefaultOrders: bulkDefaultOrders.error,
      customers: dropdownData.customersError,
      products: dropdownData.productsError,
      measurements: measurements.measurementsError,
      bulkIds: bulkCustomOrders.bulkIdsError, // Add this
    }
  };
};

// Export order status options for forms
export const ORDER_STATUS_OPTIONS = [
  { value: OrderStatus.ORDER_CONFIREMED, label: 'Order Confirmed' },
  { value: OrderStatus.FABRIC_READY, label: 'Fabric Ready' },
  { value: OrderStatus.CUTTING, label: 'Cutting' },
  { value: OrderStatus.STITCHING, label: 'Stitching' },
  { value: OrderStatus.FITTING, label: 'Fitting' },
  { value: OrderStatus.READY_FOR_PICKUP, label: 'Ready for Pickup' },
  { value: OrderStatus.COMPLETED, label: 'Completed' },
];

// Export size options for bulk default orders
export const SIZE_OPTIONS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];