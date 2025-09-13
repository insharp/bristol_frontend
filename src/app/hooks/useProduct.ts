// hooks/useProducts.ts
import { useState, useEffect } from 'react';

export interface Product {
  id: string;
  category_name: string;
  base_price: number;
  description: string;
  style_option: string;
  customer_id?: number;
  comments?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFilter {
  customer_id?: number;
  category_name?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  style_option?: string;
}

export const useProducts = (apiEndpoint?: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Use custom endpoint or default
  const baseUrl = apiEndpoint || 
    `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}`;

const fetchProducts = async (filters?: ProductFilter) => {
  setLoading(true);
  try {
    const queryParams = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const res = await fetch(`${baseUrl}/product?${queryParams.toString()}`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setProducts(data.data || data);
      return { success: true, data: data.data || data };
    } else {
      return { success: false, error: 'Failed to fetch products' };
    }
  } catch (err) {
    return { success: false, error: 'Connection error' };
  } finally {
    setLoading(false);
  }
};

  const createProduct = async (formData: any) => {
    try {
      const requestData = {
        category_name: formData.category_name,
        base_price: parseFloat(formData.base_price),
        description: formData.description,
        style_option: formData.style_option,
        comments: formData.comments,
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : undefined
      };

      const res = await fetch(
        `${baseUrl}/product`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(requestData),
        }
      );

      if (res.ok) {
        await fetchProducts();
        return { success: true, message: 'Product created successfully' };
      } else {
        const errorData = await res.json();
        return { success: false, error: errorData.message || 'Failed to create product' };
      }
    } catch (err) {
      return { success: false, error: 'Unable to create product' };
    }
  };

  
  const updateProduct = async (productId: string, formData: any) => {
    try {
      const requestData = {
        category_name: formData.category_name,
        base_price: parseFloat(formData.base_price),
        description: formData.description,
        style_option: formData.style_option,
        comments: formData.comments,
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : undefined
      };

      console.log("prduct",requestData);

      const res = await fetch(
        `${baseUrl}/product/${productId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(requestData),
        }
      );
      
      if (res.ok) {
        await fetchProducts();
        return { success: true, message: 'Product updated successfully' };
      } else {
        const errorData = await res.json();
        return { success: false, error: errorData.message || 'Failed to update product' };
      }
    } catch (err) {
      return { success: false, error: 'Unable to update product' };
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const res = await fetch(
        `${baseUrl}/product/${productId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      
      if (res.ok) {
        await fetchProducts();
        return { success: true, message: 'Product deleted successfully' };
      } else {
        const errorData = await res.json();
        return { success: false, error: errorData.message || 'Failed to delete product' };
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
    deleteProduct
  };
};