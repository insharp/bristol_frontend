// hooks/useProducts.ts
import { useState } from 'react';

export interface Product {
  id: string;
  category_name: string;
  base_price: number;
  description: string;
  style_option: string;
  comments?: string;
  customer_id?: number | null; // Allow null values
  created_at?: string;
  updated_at?: string;
}

// Match ProductFilter backend schema
export interface ProductFilter {
  category_name?: string;
  min_price?: number;
  max_price?: number;
  style_option?: string;
  search?: string;
  customer_id?: number;
}

export const useProducts = (apiEndpoint?: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const baseUrl =
    apiEndpoint ||
    `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}`;

  // Helper to build query string from filters
  const buildQuery = (filters?: ProductFilter) => {
    if (!filters) return '';
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    return params.toString() ? `?${params.toString()}` : '';
  };

  const fetchProducts = async (filters?: ProductFilter) => {
    setLoading(true);
    try {
      const query = buildQuery(filters);
      const res = await fetch(`${baseUrl}/product${query}`, {
        credentials: 'include',
      });

      if (res.ok) {
      const data = await res.json();
      console.log('Raw API response:', data); 
      
      const productsData = data.data || data.products || data;
      console.log('Processed products data:', productsData); 
      
      setProducts(Array.isArray(productsData) ? productsData : []);
      return { success: true, data: productsData };
    } else {
        return { success: false, error: 'Failed to load products' };
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      return { success: false, error: 'Connection error' };
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (formData: any) => {
    try {
      const requestData: any = {
        category_name: formData.category_name,
        base_price: parseFloat(formData.base_price),
        description: formData.description,
        style_option: formData.style_option,
        comments: formData.comments || "",
        customer_id: null, // Always include customer_id, default to null
      };

      // Only set customer_id if it exists and is not empty
      if (formData.customer_id && formData.customer_id.trim() !== '') {
        requestData.customer_id = parseInt(formData.customer_id);
      }

      console.log('Sending request data:', requestData); // Debug log

      const res = await fetch(`${baseUrl}/product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      if (res.ok) {
        await fetchProducts();
        return { success: true, message: 'Product created successfully' };
      } else {
        const errorData = await res.json();
        console.error('API Error Response:', errorData);
        console.error('Response Status:', res.status);
        
        // Handle different error response structures
        let errorMessage = 'Failed to create product';
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // Pydantic validation errors
            errorMessage = errorData.detail.map((err: any) => err.msg || err.message || JSON.stringify(err)).join(', ');
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else {
            errorMessage = JSON.stringify(errorData.detail);
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (err) {
      console.error('Create Product Error:', err);
      return { success: false, error: 'Unable to create product' };
    }
  };

  const updateProduct = async (productId: string, formData: any) => {
    try {
      const requestData: any = {
        category_name: formData.category_name,
        base_price: parseFloat(formData.base_price),
        description: formData.description,
        style_option: formData.style_option,
        comments: formData.comments,
        customer_id: null, // Always include customer_id, default to null
      };

      // Set customer_id if provided
      if (formData.customer_id && formData.customer_id.trim() !== '') {
        requestData.customer_id = parseInt(formData.customer_id);
      }

      console.log('Sending update data:', requestData);

      const res = await fetch(`${baseUrl}/product/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      if (res.ok) {
        await fetchProducts();
        return { success: true, message: 'Product updated successfully' };
      } else {
        const errorData = await res.json();
        console.error('API Error Response:', errorData);
        return {
          success: false,
          error: errorData.message || errorData.detail || 'Failed to update product',
        };
      }
    } catch (err) {
      console.error('Update Product Error:', err);
      return { success: false, error: 'Unable to update product' };
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const res = await fetch(`${baseUrl}/product/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        await fetchProducts();
        return { success: true, message: 'Product deleted successfully' };
      } else {
        const errorData = await res.json();
        return {
          success: false,
          error: errorData.message || errorData.detail || 'Failed to delete product',
        };
      }
    } catch (err) {
      return { success: false, error: 'Unable to delete product' };
    }
  };

  return {
    products,
    loading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};