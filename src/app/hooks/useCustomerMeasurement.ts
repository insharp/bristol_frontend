// hooks/useCustomerMeasurement.ts
import { useState, useCallback } from 'react';
import { 
  IndividualMeasurement, 
  CorporateMeasurement, 
  Customer, 
  Product, 
  MeasurementField 
} from '../types/CustomerMeasurement.types';

// Base API URL - adjust according to your FastAPI setup
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}`;

export const useCustomerMeasurement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const clearError = useCallback(() => setError(''), []);

  // Generic fetch function with error handling
const fetchData = useCallback(async (endpoint: string, options?: RequestInit) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
      
      // Don't treat "no data found" scenarios as errors - with null safety
      if (response.status === 404 || 
          (errorMessage && errorMessage.toLowerCase().includes('no measurement')) ||
          (errorMessage && errorMessage.toLowerCase().includes('not found')) ||
          (errorMessage && errorMessage.toLowerCase().includes('no data'))) {
        // Return empty array for "no data" scenarios instead of throwing
        return [];
      }
      
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (err) {
    // Only set error for actual errors, not "no data" scenarios - with null safety
    if (err instanceof Error && err.message) {
      const message = err.message.toLowerCase();
      if (!message.includes('no measurement') &&
          !message.includes('not found') &&
          !message.includes('no data')) {
        const errorMessage = err.message || 'An unexpected error occurred';
        setError(errorMessage);
      }
    }
    throw err;
  }
}, []);

  const fetchIndividualMeasurements = useCallback(async (): Promise<IndividualMeasurement[]> => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchData('/customer-measurement/customer/all/');
      return Array.isArray(data) ? data : [];
    } catch (err) {
      // Return empty array for "no data" scenarios
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage.toLowerCase().includes('no measurement') ||
          errorMessage.toLowerCase().includes('not found') ||
          errorMessage.toLowerCase().includes('no data')) {
        return [];
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchData]);
  
  const saveIndividualMeasurement = useCallback(async (data: any, isEdit: boolean = false): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        // PUT request: /customer-measurement/customer/{customer_id}/product/{product_id}
        if (!data.customer_id || !data.product_id) {
          throw new Error('Customer ID and Product ID are required for updating measurement');
        }
        await fetchData(`/customer-measurement/customer/${data.customer_id}/product/${data.product_id}/`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } else {
        // POST request: /customer-measurement
        await fetchData('/customer-measurement/', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const deleteIndividualMeasurement = useCallback(async (customerId: string, productId: string): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      await fetchData(`/customer-measurement/customer/${customerId}/product/${productId}`, {
        method: 'DELETE',
      });
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  // Corporate measurements
  const fetchCorporateMeasurements = useCallback(async (): Promise<CorporateMeasurement[]> => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchData('/corporate-measurement/corporate/all');
      return Array.isArray(data) ? data : [];
    } catch (err) {
      // Return empty array for "no data" scenarios
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage.toLowerCase().includes('no measurement') ||
          errorMessage.toLowerCase().includes('not found') ||
          errorMessage.toLowerCase().includes('no data')) {
        return [];
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const saveCorporateMeasurement = useCallback(async (data: any, isEdit: boolean = false): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        // PUT request: /corporate-measurement/{bulk_id}
        if (!data.id) {
          throw new Error('Bulk ID is required for updating corporate measurement');
        }
        await fetchData(`/corporate-measurement/${data.id}/`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } else {
        // POST request: /corporate-measurement
        await fetchData('/corporate-measurement/', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const deleteCorporateMeasurement = useCallback(async (bulkId: string): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      await fetchData(`/corporate-measurement/${bulkId}/`, {
        method: 'DELETE',
      });
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  return {
    loading,
    error,
    clearError,
    // Individual methods
    fetchIndividualMeasurements,
    saveIndividualMeasurement,
    deleteIndividualMeasurement,
    // Corporate methods
    fetchCorporateMeasurements,
    saveCorporateMeasurement,
    deleteCorporateMeasurement,
  };
};

// Hook for customers
export const useCustomers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchCustomers = useCallback(async (type: 'individual' | 'corporate'): Promise<Customer[]> => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching customers with type:', type);
      console.log('API Base URL:', API_BASE_URL);

      const params = new URLSearchParams();
    
      if (type) {
        params.append('customer_type', type);
      }
      
      const url = `${API_BASE_URL}/customer?${params.toString()}`;
      console.log('Fetching from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        credentials: "include",
        headers: { 
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: Failed to fetch ${type} customers`;
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Customers data received:', data);
      return data;
    } catch (err) {
      console.error('Fetch customers error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customers';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchCustomers,
  };
};

// Enhanced Hook for products with customer filtering
export const useProducts = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchProducts = useCallback(async (): Promise<Product[]> => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/product`, {credentials: "include"});

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch products');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // NEW: Get products for a specific customer (includes default products)
  const getCustomerProducts = useCallback(async (
    customerId: string,
    customerType: 'individual' | 'corporate'
  ): Promise<Product[]> => {
    setLoading(true);
    setError('');
    try {
      // Fetch all products
      const allProducts = await fetchProducts();
      
      // Get existing measurements for this customer to include products they already have
      let existingProductIds: string[] = [];
      try {
        const measurementEndpoint = customerType === 'individual' 
          ? `/customer-measurement/customer/all/`
          : `/corporate-measurement/corporate/all`;
          
        const response = await fetch(`${API_BASE_URL}${measurementEndpoint}`, {
          credentials: "include"
        });
        
        if (response.ok) {
          const measurements = await response.json();
          // Filter measurements for this specific customer
          const customerMeasurements = measurements.filter((m: any) => 
            customerType === 'individual' 
              ? m.customer_id === customerId 
              : m.corporate_customer_id === customerId
          );
          existingProductIds = customerMeasurements.map((m: any) => m.product_id);
        }
      } catch (err) {
        console.warn('Could not fetch existing measurements:', err);
      }

      // Filter products based on business logic
      const filteredProducts = allProducts.filter((product: any) => {
        console.log('Filtering product:', product.id, 'customer_id:', product.customer_id, 'for customer:', customerId);
        
        // Always include products with no customer assignment (default/universal products)
        if (!product.customer_id || product.customer_id === '' || product.customer_id === '0' || product.customer_id === 0) {
          console.log('Including default product:', product.id);
          return true;
        }
        
        // Include products the customer already has measurements for
        if (existingProductIds.includes(product.id)) {
          console.log('Including existing measurement product:', product.id);
          return true;
        }
        
        // Include products specifically assigned to this customer
        if (product.customer_id === customerId || product.customer_id === parseInt(customerId)) {
          console.log('Including customer-specific product:', product.id);
          return true;
        }
        
        console.log('Excluding product:', product.id);
        return false;
      });

      // Sort products: defaults first, then customer-specific, then alphabetical
      const sortedProducts = filteredProducts.sort((a: any, b: any) => {
        // Defaults first (no customer_id)
        const aIsDefault = !a.customer_id || a.customer_id === '' || a.customer_id === '0' || a.customer_id === 0;
        const bIsDefault = !b.customer_id || b.customer_id === '' || b.customer_id === '0' || b.customer_id === 0;
        
        if (aIsDefault && !bIsDefault) return -1;
        if (!aIsDefault && bIsDefault) return 1;
        
        // Customer-specific second
        const aIsCustomer = a.customer_id === customerId || a.customer_id === parseInt(customerId);
        const bIsCustomer = b.customer_id === customerId || b.customer_id === parseInt(customerId);
        
        if (aIsCustomer && !bIsCustomer) return -1;
        if (!aIsCustomer && bIsCustomer) return 1;
        
        // Then alphabetical by category_name
        const aName = a.category_name || a.name || a.product_name || '';
        const bName = b.category_name || b.name || b.product_name || '';
        return aName.localeCompare(bName);
      });

      console.log('Filtered products for customer', customerId, ':', sortedProducts);
      return sortedProducts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customer products';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  return {
    loading,
    error,
    fetchProducts,
    getCustomerProducts, // New method for customer-specific filtering
  };
};

// Hook for measurement fields
export const useMeasurementFields = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchMeasurementFields = useCallback(async (productId: string): Promise<MeasurementField[]> => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/measurement-field/product/${productId}/`, {credentials: "include"});

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch measurement fields');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch measurement fields';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchMeasurementFields,
  };
};