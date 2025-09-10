"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Plus, RefreshCw, Package, X } from "lucide-react";

// Order Status Enum - matching your backend schema
export enum OrderStatus {
  ORDER_CONFIREMED = "order_confirmed", // Note: keeping your typo to match backend
  FABRIC_READY = "fabric_ready",
  CUTTING = "cutting",
  STITCHING = "stitching",
  FITTING = "fitting",
  READY_FOR_PICKUP = "ready_for_pickup",
  COMPLETED = "completed",
}

// Single Order Types - matching your Pydantic schemas
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
}

// Custom Hook for Single Orders
const useSingleOrders = (baseUrl: string = "http://localhost:8000", authToken?: string) => {
  const [state, setState] = useState({
    orders: [] as SingleOrderResponse[],
    selectedOrder: null as SingleOrderResponse | null,
    customers: [] as { id: number; name: string }[],
    products: [] as { id: number; name: string; price: number; category_name: string }[],
    loading: false,
    creating: false,
    updating: false,
    deleting: false,
    error: null as string | null,
  });

  const makeRequest = useCallback(
    async (url: string, method: "GET" | "POST" | "PUT" | "DELETE" = "GET", body?: any): Promise<any> => {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const config: RequestInit = {
        method,
        headers,
        credentials: "include",
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
    console.error("Single Order API error:", error);
  }, []);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setState((p) => ({ ...p, loading: true, error: null }));
      
      const customerBaseUrl = `http://${process.env.NEXT_PUBLIC_BACKEND_HOST || 'localhost'}:${process.env.NEXT_PUBLIC_BACKEND_PORT || '8000'}`;
      
      const res = await fetch(`${customerBaseUrl}/customer`, { 
        credentials: "include" 
      });
      
      if (res.ok) {
        const data = await res.json();
        const customerData = data.data || data;
        
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
        setState((p) => ({ 
          ...p, 
          customers: [],
          loading: false,
          error: "Failed to fetch customers"
        }));
        return { success: false, error: "Failed to fetch customers" };
      }
    } catch (err) {
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

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setState((p) => ({ ...p, loading: true, error: null }));
      
      const productBaseUrl = `http://${process.env.NEXT_PUBLIC_BACKEND_HOST || 'localhost'}:${process.env.NEXT_PUBLIC_BACKEND_PORT || '8000'}`;
      
      const res = await fetch(`${productBaseUrl}/product`, { 
        credentials: "include" 
      });
      
      if (res.ok) {
        const data = await res.json();
        const productData = data.data || data;
        
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
        setState((p) => ({ 
          ...p, 
          products: [],
          loading: false,
          error: "Failed to fetch products"
        }));
        return { success: false, error: "Failed to fetch products" };
      }
    } catch (err) {
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

  // Check if measurements exist for customer-product combination
  const checkMeasurementsExist = useCallback(async (customerId: number, productId: number) => {
    try {
      const measurementBaseUrl = `http://${process.env.NEXT_PUBLIC_BACKEND_HOST || 'localhost'}:${process.env.NEXT_PUBLIC_BACKEND_PORT || '8000'}`;
      
      const res = await fetch(`${measurementBaseUrl}/measurement/${customerId}/${productId}`, { 
        credentials: "include" 
      });
      
      if (res.ok) {
        return { exists: true };
      } else if (res.status === 404) {
        return { exists: false };
      } else {
        const errorText = await res.text().catch(() => 'Unknown error');
        return { exists: false, error: `Error checking measurements: ${errorText}` };
      }
    } catch (err) {
      console.error("Error checking measurements:", err);
      const errorMessage = err instanceof Error ? err.message : "Connection error while checking measurements";
      return { exists: false, error: errorMessage };
    }
  }, []);

  // CRUD Operations
  const createSingleOrder = useCallback(
    async (data: SingleOrderCreate) => {
      try {
        setState((p) => ({ ...p, creating: true, error: null }));
        const order = await makeRequest("/orders/single", "POST", data);
        setState((p) => ({
          ...p,
          orders: [...p.orders, order],
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

  const getAllSingleOrders = useCallback(async () => {
    try {
      setState((p) => ({ ...p, loading: true, error: null }));
      const orders = await makeRequest("/orders/single");
      setState((p) => ({ ...p, orders, loading: false }));
      return orders;
    } catch (e) {
      handleError(e);
      setState((p) => ({ ...p, loading: false }));
      return [];
    }
  }, [makeRequest, handleError]);

  const getSingleOrder = useCallback(
    async (id: number) => {
      try {
        setState((p) => ({ ...p, loading: true, error: null }));
        const order = await makeRequest(`/orders/single/${id}`);
        setState((p) => ({ ...p, selectedOrder: order, loading: false }));
        return order;
      } catch (e) {
        handleError(e);
        setState((p) => ({ ...p, loading: false }));
        return null;
      }
    },
    [makeRequest, handleError]
  );

  const updateSingleOrder = useCallback(
    async (id: number, data: SingleOrderUpdate) => {
      try {
        setState((p) => ({ ...p, updating: true, error: null }));
        const updated = await makeRequest(`/orders/single/${id}`, "PUT", data);
        setState((p) => ({
          ...p,
          orders: p.orders.map((o) => (o.id === id ? updated : o)),
          selectedOrder: p.selectedOrder?.id === id ? updated : p.selectedOrder,
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
          orders: p.orders.filter((o) => o.id !== id),
          selectedOrder: p.selectedOrder?.id === id ? null : p.selectedOrder,
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

  const clearError = useCallback(() => setState((p) => ({ ...p, error: null })), []);

  return {
    ...state,
    createSingleOrder,
    getAllSingleOrders,
    getSingleOrder,
    updateSingleOrder,
    deleteSingleOrder,
    fetchCustomers,
    fetchProducts,
    checkMeasurementsExist,
    clearError,
  };
};

// Button Component
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = "", 
  ...props 
}) => (
  <button
    className={`bg-blue-600 hover:bg-blue-700 text-white text-sm font-light py-2 px-4 rounded transition-colors duration-150 ${className}`}
    {...props}
  >
    {children}
  </button>
);

// Table Component
interface TableColumn {
  key: string;
  label: string;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableAction {
  label: string;
  icon: React.ReactNode;
  onClick: (row: any) => void;
  className?: string;
}

const Table: React.FC<{
  data: any[];
  columns: TableColumn[];
  actions: TableAction[];
  loading: boolean;
  emptyMessage: string;
}> = ({ data, columns, actions, loading, emptyMessage }) => {
  const [actionsOpen, setActionsOpen] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                style={{ width: column.width }}
              >
                {column.label}
              </th>
            ))}
            {actions.length > 0 && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={row.id || index} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
              {actions.length > 0 && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                  <button
                    onClick={() => setActionsOpen(actionsOpen === index ? null : index)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                  {actionsOpen === index && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                      <div className="py-1">
                        {actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={() => {
                              action.onClick(row);
                              setActionsOpen(null);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${action.className || ""}`}
                          >
                            <span className="mr-2">{action.icon}</span>
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Modal Component
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <section className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="relative w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-xl">
              <div className="flex items-center justify-between px-4 py-6 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">{title}</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">{children}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// Message Modal
const MessageModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  title: string;
  message: string;
}> = ({ isOpen, onClose, type, title, message }) => {
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
              className={type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              OK
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
const SingleOrderManagement: React.FC<{
  title?: string;
  apiEndpoint?: string;
  authToken?: string;
}> = ({
  title = "Single Orders",
  apiEndpoint = "http://localhost:8000",
  authToken
}) => {
  const {
    orders,
    customers,
    products,
    loading,
    creating,
    updating,
    deleting,
    error,
    createSingleOrder,
    getAllSingleOrders,
    updateSingleOrder,
    deleteSingleOrder,
    fetchCustomers,
    fetchProducts,
    checkMeasurementsExist,
    clearError
  } = useSingleOrders(apiEndpoint, authToken);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedOrder, setSelectedOrder] = useState<SingleOrderResponse | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    customerid: "",
    productid: "",
    quantity: 1,
    unitprice: 0,
    status: OrderStatus.ORDER_CONFIREMED,
    stylepreference: "",
    speacial_requests: ""
  });

  // Measurement status state
  const [measurementStatus, setMeasurementStatus] = useState<{
    checking: boolean;
    exists: boolean;
    error?: string;
  }>({ checking: false, exists: false });

  // Message modal state
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: ''
  });

  // Form errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      await fetchCustomers();
      await fetchProducts();
      await getAllSingleOrders();
    };
    initializeData();
  }, []);

  // Clear error when modal opens/closes
  useEffect(() => {
    if (error) clearError();
  }, [isModalOpen]);

  // Check measurements when both customer and product are selected
  useEffect(() => {
    const checkMeasurements = async () => {
      if (formData.customerid && formData.productid && modalMode !== 'view') {
        setMeasurementStatus({ checking: true, exists: false });
        
        const result = await checkMeasurementsExist(
          Number(formData.customerid), 
          Number(formData.productid)
        );
        
        setMeasurementStatus({
          checking: false,
          exists: result.exists,
          error: result.error
        });
      } else {
        setMeasurementStatus({ checking: false, exists: false });
      }
    };
    
    checkMeasurements();
  }, [formData.customerid, formData.productid, modalMode, checkMeasurementsExist]);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const customer = customers.find(c => c.id === order.customerid);
    const product = products.find(p => p.id === order.productid);
    
    return (
      order.id.toString().includes(searchLower) ||
      customer?.name?.toLowerCase().includes(searchLower) ||
      product?.name?.toLowerCase().includes(searchLower) ||
      order.status.toLowerCase().includes(searchLower)
    );
  });

  // Table columns
  const columns: TableColumn[] = [
    { 
      key: "id", 
      label: "Order ID", 
      width: "120px",
      render: (value: any) => <span className="font-medium">#{value}</span>
    },
    { 
      key: "customer_name", 
      label: "Customer", 
      width: "200px",
      render: (value: any, row: any) => {
        const customer = customers.find(c => c.id === row.customerid);
        return <span className="font-medium">{customer?.name || 'Unknown Customer'}</span>;
      }
    },
    {
      key: "product_name",
      label: "Product",
      width: "150px",
      render: (value: any, row: any) => {
        const product = products.find(p => p.id === row.productid);
        return <span>{product?.name || 'Unknown Product'}</span>;
      },
    },
    { key: "quantity", label: "Quantity", width: "100px" },
    {
      key: "unitprice",
      label: "Unit Price",
      width: "120px",
      render: (value: number) => <span>Rs.{value.toFixed(2)}</span>,
    },
    {
      key: "status",
      label: "Status",
      width: "150px",
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === OrderStatus.COMPLETED ? 'bg-green-100 text-green-800' :
          value === OrderStatus.ORDER_CONFIREMED ? 'bg-blue-100 text-blue-800' :
          value === OrderStatus.FABRIC_READY ? 'bg-yellow-100 text-yellow-800' :
          value === OrderStatus.CUTTING ? 'bg-orange-100 text-orange-800' :
          value === OrderStatus.STITCHING ? 'bg-purple-100 text-purple-800' :
          value === OrderStatus.FITTING ? 'bg-indigo-100 text-indigo-800' :
          value === OrderStatus.READY_FOR_PICKUP ? 'bg-pink-100 text-pink-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value.replace(/_/g, ' ').toUpperCase()}
        </span>
      ),
    }
  ];

  // Table actions
  const actions: TableAction[] = [
    {
      label: "View",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      onClick: (order: any) => {
        setSelectedOrder(order);
        setFormDataFromOrder(order);
        setModalMode("view");
        setIsModalOpen(true);
      },
    },
    {
      label: "Edit",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      onClick: (order: any) => {
        setSelectedOrder(order);
        setFormDataFromOrder(order);
        setModalMode("edit");
        setIsModalOpen(true);
      },
    },
    {
      label: "Delete",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      onClick: (order: any) => {
        if (window.confirm(`Are you sure you want to delete Order #${order.id}?`)) {
          handleDeleteOrder(order.id);
        }
      },
      className: "text-red-600 hover:bg-red-50",
    }
  ];

  // Helper functions
  const resetFormData = () => {
    setFormData({
      customerid: "",
      productid: "",
      quantity: 1,
      unitprice: 0,
      status: OrderStatus.ORDER_CONFIREMED,
      stylepreference: "",
      speacial_requests: ""
    });
  };

  const setFormDataFromOrder = (order: SingleOrderResponse) => {
    setFormData({
      customerid: order.customerid.toString(),
      productid: order.productid.toString(),
      quantity: order.quantity,
      unitprice: order.unitprice,
      status: order.status,
      stylepreference: order.stylepreference || "",
      speacial_requests: order.speacial_requests || ""
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.customerid) errors.customerid = 'Customer is required';
    if (!formData.productid) errors.productid = 'Product is required';
    if (!formData.quantity || formData.quantity <= 0) errors.quantity = 'Valid quantity is required';
    if (!formData.unitprice || formData.unitprice <= 0) errors.unitprice = 'Valid unit price is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const showSuccessMessage = (title: string, message: string) => {
    setMessageModal({ isOpen: true, type: 'success', title, message });
  };

  const showErrorMessage = (title: string, message: string) => {
    setMessageModal({ isOpen: true, type: 'error', title, message });
  };

  // CRUD handlers
  const openCreateModal = () => {
    setSelectedOrder(null);
    resetFormData();
    setFormErrors({});
    setModalMode("create");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
    setFormErrors({});
    setMeasurementStatus({ checking: false, exists: false });
  };

  const handleCreateOrder = async () => {
    if (!validateForm()) return;

    // Check if measurements exist before creating order
    const customerId = Number(formData.customerid);
    const productId = Number(formData.productid);
    
    const measurementCheck = await checkMeasurementsExist(customerId, productId);
    
    if (measurementCheck.error) {
      showErrorMessage('Measurement Check Failed', measurementCheck.error);
      return;
    }
    
    if (!measurementCheck.exists) {
      showErrorMessage(
        'Measurements Required', 
        'Measurements do not exist for this customer and product combination. Please add measurements before creating the order.'
      );
      return;
    }

    const orderData: SingleOrderCreate = {
      customerid: customerId,
      productid: productId,
      quantity: formData.quantity,
      unitprice: formData.unitprice,
      status: formData.status,
      stylepreference: formData.stylepreference,
      speacial_requests: formData.speacial_requests
    };

    const result = await createSingleOrder(orderData);
    if (result) {
      closeModal();
      showSuccessMessage('Success!', 'Single order has been created successfully.');
      await getAllSingleOrders();
    } else {
      showErrorMessage('Creation Failed', 'Failed to create single order');
    }
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder || !validateForm()) return;

    const orderData: SingleOrderUpdate = {
      customerid: Number(formData.customerid),
      productid: Number(formData.productid),
      quantity: formData.quantity,
      unitprice: formData.unitprice,
      status: formData.status,
      stylepreference: formData.stylepreference,
      speacial_requests: formData.speacial_requests
    };

    const result = await updateSingleOrder(selectedOrder.id, orderData);
    if (result) {
      closeModal();
      showSuccessMessage('Success!', 'Single order has been updated successfully.');
      await getAllSingleOrders();
    } else {
      showErrorMessage('Update Failed', 'Failed to update single order');
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    const result = await deleteSingleOrder(orderId);
    if (result) {
      showSuccessMessage('Success!', `Order #${orderId} has been deleted.`);
      await getAllSingleOrders();
    } else {
      showErrorMessage('Deletion Failed', `Failed to delete Order #${orderId}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === "create") {
      await handleCreateOrder();
    } else if (modalMode === "edit") {
      await handleUpdateOrder();
    }
  };

  const getModalTitle = () => {
    switch (modalMode) {
      case "create": return "Add New Single Order";
      case "edit": return "Edit Single Order";
      case "view": return "View Single Order";
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <main className="flex-1 p-6 bg-gray-50 flex flex-col overflow-hidden">
        {/* Header Section */}
        <div className="flex-shrink-0 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Order
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button onClick={clearError} className="inline-flex text-red-400 hover:text-red-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table Container */}
        <div className="flex-1 min-h-0 bg-white rounded-lg border border-gray-200">
          <Table
            data={filteredOrders}
            columns={columns}
            actions={actions}
            loading={loading}
            emptyMessage="No single orders found."
          />
        </div>

        {/* Create/Edit Modal */}
        <Modal isOpen={isModalOpen} onClose={closeModal} title={getModalTitle()}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Customer *</label>
              <select
                value={formData.customerid}
                onChange={(e) => setFormData({ ...formData, customerid: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.customerid ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                disabled={modalMode === "view"}
                required
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {formErrors.customerid && (
                <p className="mt-1 text-sm text-red-600">{formErrors.customerid}</p>
              )}
            </div>

            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Product *</label>
              <select
                value={formData.productid}
                onChange={(e) => {
                  const selectedProduct = products.find(p => p.id === Number(e.target.value));
                  setFormData({ 
                    ...formData, 
                    productid: e.target.value,
                    unitprice: selectedProduct?.price || 0
                  });
                }}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.productid ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                disabled={modalMode === "view"}
                required
              >
                <option value="">Select Product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - Rs.{product.price.toFixed(2)}
                  </option>
                ))}
              </select>
              {formErrors.productid && (
                <p className="mt-1 text-sm text-red-600">{formErrors.productid}</p>
              )}
            </div>

            {/* Measurement Status Indicator */}
            {(formData.customerid && formData.productid && modalMode !== 'view') && (
              <div className="mt-2 p-3 rounded-lg border border-gray-200 bg-gray-50">
                {measurementStatus.checking ? (
                  <div className="text-blue-600 text-sm flex items-center">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Checking measurements...
                  </div>
                ) : measurementStatus.error ? (
                  <div className="text-red-600 text-sm">
                    Error: {measurementStatus.error}
                  </div>
                ) : measurementStatus.exists ? (
                  <div className="text-green-600 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Measurements available - ready to create order
                  </div>
                ) : (
                  <div className="text-red-600 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Measurements required - cannot create order without measurements
                  </div>
                )}
              </div>
            )}

            {/* Quantity and Unit Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    formErrors.quantity ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2`}
                  readOnly={modalMode === "view"}
                  required
                />
                {formErrors.quantity && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.quantity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Unit Price *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitprice}
                  onChange={(e) => setFormData({ ...formData, unitprice: Number(e.target.value) })}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    formErrors.unitprice ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2`}
                  readOnly={modalMode === "view"}
                  required
                />
                {formErrors.unitprice && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.unitprice}</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as OrderStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={modalMode === "view"}
              >
                {Object.values(OrderStatus).map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Style Preferences */}
            <div>
              <label className="block text-sm font-medium mb-2">Style Preferences</label>
              {modalMode === "view" ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 min-h-[80px]">
                  {formData.stylepreference || 'No style preferences specified'}
                </div>
              ) : (
                <textarea
                  value={formData.stylepreference}
                  onChange={(e) => setFormData({ ...formData, stylepreference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter style preferences"
                />
              )}
            </div>

            {/* Special Requests */}
            <div>
              <label className="block text-sm font-medium mb-2">Special Requests</label>
              {modalMode === "view" ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 min-h-[80px]">
                  {formData.speacial_requests || 'No special requests provided'}
                </div>
              ) : (
                <textarea
                  value={formData.speacial_requests}
                  onChange={(e) => setFormData({ ...formData, speacial_requests: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter any special requests"
                />
              )}
            </div>

            {/* Button Section */}
            <div className="flex justify-end pt-4 gap-3">
              {modalMode === "view" ? (
                <>
                  <Button 
                    type="button"
                    onClick={() => {
                      if (!selectedOrder) return;
                      if (window.confirm(`Are you sure you want to delete Order #${selectedOrder.id}?`)) {
                        setIsModalOpen(false);
                        handleDeleteOrder(selectedOrder.id);
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => {
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
                </>
              ) : (
                <>
                  <Button 
                    type="button"
                    onClick={closeModal}
                    className="bg-gray-500 hover:bg-gray-600 text-white"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={creating || updating || (modalMode === "create" && !measurementStatus.exists)}
                  >
                    {creating || updating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        {modalMode === "create" ? "Creating..." : "Updating..."}
                      </>
                    ) : (
                      modalMode === "create" ? "Create Order" : "Update Order"
                    )}
                  </Button>
                </>
              )}
            </div>
          </form>
        </Modal>

        {/* Message Modal */}
        <MessageModal
          isOpen={messageModal.isOpen}
          onClose={() => setMessageModal({ ...messageModal, isOpen: false })}
          type={messageModal.type}
          title={messageModal.title}
          message={messageModal.message}
        />
      </main>
    </div>
  );
};

export default SingleOrderManagement;