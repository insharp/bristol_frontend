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

  
//   // Get measurement fields by product ID
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
      const response = await fetch(`${baseUrl}/${id}`, {
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
  setError(null);
  try {
    const response = await fetch(`${baseUrl}/product-measurement/product/${productId}/size/${size}`, {
      credentials:"include",
      method: 'DELETE',
    });
   
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to delete product measurement');
    }

    // Optionally handle the success response
    const result = await response.json();
    console.log('Delete successful:', result.message);
    
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred');
    throw err;
  } finally {
    setLoading(false);
  }
}, []);




  // Get single product measurement
  const getProductMeasurement = useCallback(async (id: number): Promise<ProductMeasurement> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/${id}`,{credentials:"include"});
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
    createProductMeasurement,
    updateProductMeasurement,
    deleteProductMeasurement,
    getProductMeasurement,
  };
};

export default useProductMeasurement;