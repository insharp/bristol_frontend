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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const useCustomerMeasurement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const clearError = useCallback(() => setError(''), []);

  // Generic fetch function with error handling
  const fetchData = useCallback(async (endpoint: string, options?: RequestInit) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    }
  }, []);



 

 


   const fetchIndividualMeasurements = useCallback(async (): Promise<IndividualMeasurement[]> => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchData('/customer-measurement/customer/all/');
      return data;
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
      return data;
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
        params.append('customer_type',type);
        }
      
      const url = `${API_BASE_URL}/customer?${params.toString()}`;
        console.log('Fetching from URL:', url);

        const response = await fetch(url, {
        method: 'GET',
        headers: { 
            'Content-Type': 'application/json',
            // Add authentication if needed:
            // 'Authorization': `Bearer ${token}`
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

// Hook for products
export const useProducts = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchProducts = useCallback(async (): Promise<Product[]> => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/product`);

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

  return {
    loading,
    error,
    fetchProducts,
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
      const response = await fetch(`${API_BASE_URL}/measurement-field/product/${productId}/`);

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