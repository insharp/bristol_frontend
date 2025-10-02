// hooks/useProductMeasurement.ts
import { useState, useCallback } from 'react';

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

export interface ProductMeasurement {
  id: number;
  product_id: number;
  product_name: string;
  customer_name?: string; // Added customer name
  size: string;
  measurements: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateProductMeasurementData {
  product_id: number;
  size: string;
  measurements: Record<string, any>;
}

export interface Product {
  id: number;
  category_name: string;  // Changed from 'name' to 'category_name'
  base_price: number;
  description?: string;
  style_option: string;
  comments?: string;
  customer_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
}

const useProductMeasurement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use custom endpoint or default
  const baseUrl =  
    `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}`;

  // Get all product measurements
  const getProductMeasurements = useCallback(async (): Promise<ProductMeasurement[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/product-measurement`,{credentials:"include"});
      if (!response.ok) {
        throw new Error('Failed to fetch product measurements');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get measurement fields by product ID
  const getMeasurementFields = useCallback(async (productId: number): Promise<MeasurementField[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/measurement-field/product/${productId}`,{credentials:"include"});
      if (!response.ok) {
        throw new Error('Failed to fetch measurement fields');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get all products for dropdown
  const getProducts = useCallback(async (): Promise<Product[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/product`,{credentials:"include"});
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get all customers for dropdown
  const getCustomers = useCallback(async (): Promise<Customer[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/customer`,{credentials:"include"});
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create product measurement
  const createProductMeasurement = useCallback(async (data: CreateProductMeasurementData): Promise<ProductMeasurement> => {
    setLoading(true);
    setError(null);
    try {
      console.log(data)
      const response = await fetch(`${baseUrl}/product-measurement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create product measurement');
      }
      
      const result = await response.json();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update product measurement
  const updateProductMeasurement = useCallback(async (id: number, data: CreateProductMeasurementData): Promise<ProductMeasurement> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/product-measurement/${id}`, {
        credentials:"include",
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update product measurement');
      }
      
      const result = await response.json();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete product measurement by product ID and size
  const deleteProductMeasurement = useCallback(async (productId: number, size: string): Promise<void> => {
  setLoading(true);
  setError('');
  
  try {
    const response = await fetch(`${baseUrl}/product-measurement/product/${productId}/size/${size}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return;
    }

    // Try to get error details from response
    let errorData = {};
    try {
      errorData = await response.json();
    } catch (jsonError) {
      console.warn('Could not parse error response as JSON:', jsonError);
    }

    // Create error with response details
    const error = new Error((errorData as any).message || (errorData as any).detail || `HTTP ${response.status}: ${response.statusText}`);
    (error as any).response = {
      status: response.status,
      statusText: response.statusText,
      data: errorData
    };
    
    throw error;
    
  } catch (error: any) {
    console.error('Delete product measurement error:', error);
    
    // More comprehensive constraint error detection
    const errorMessage = error.message?.toLowerCase() || '';
    const hasConstraintIndicators = 
      errorMessage.includes('foreign_key_constraint') ||
      errorMessage.includes('foreign key constraint') ||
      errorMessage.includes('orders exist for this product/size') ||
      errorMessage.includes('cannot delete product measurement because orders exist') ||
      error.response?.data?.error === 'FOREIGN_KEY_CONSTRAINT';
    
    if (error.response?.status === 409 || hasConstraintIndicators) {
      console.log('🔍 Detected constraint error, transforming...');
      const constraintError = new Error('Foreign key constraint violation');
      (constraintError as any).isConstraintError = true;
      throw constraintError;
    }
    
    throw error;
  } finally {
    setLoading(false);
  }
}, []);

  // Get single product measurement
  const getProductMeasurement = useCallback(async (id: number): Promise<ProductMeasurement> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/product-measurement/${id}`,{credentials:"include"});
      if (!response.ok) {
        throw new Error('Failed to fetch product measurement');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getProductMeasurements,
    getMeasurementFields,
    getProducts,
    getCustomers, // Added getCustomers function
    createProductMeasurement,
    updateProductMeasurement,
    deleteProductMeasurement,
    getProductMeasurement,
  };
};

export default useProductMeasurement;