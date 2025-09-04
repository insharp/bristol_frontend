// hooks/useProducts.ts
import { useState, useEffect } from 'react';

export interface Product {
  id: string;
  category_name: string;
  base_price: number;
  description: string;
  style_option: string;
  comments?: string;
  created_at?: string;
  updated_at?: string;
}

export const useProducts = (apiEndpoint?: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Use custom endpoint or default
  const baseUrl = apiEndpoint || 
    `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}`;


  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${baseUrl}/product`,
        { credentials: "include" }
      );
      
      if (res.ok) {
        const data = await res.json();
        console.log(data);
        setProducts(data.data || data);
        return { success: true, data: data.data || data };
      } else {
        return { success: false, error: 'Failed to load products' };
      }
    } catch (err) {
      console.error("Error fetching products:", err);
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
        comments: formData.comments
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
        comments: formData.comments
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