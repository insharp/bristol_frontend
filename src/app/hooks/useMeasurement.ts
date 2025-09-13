// hooks/useMeasurementField.ts
"use client";
import { useState, useCallback } from "react";

export interface MeasurementField {
  id: number;
  field_name: string;
  field_type: string;
  unit: string;
  is_required: string;
  created_at: string;
  updated_at: string;
}

export interface MeasurementFieldGroup {
  product_id: number;
  measurement_fields: MeasurementField[];
}

export interface MeasurementFieldResponse {
  success: boolean;
  data?: MeasurementFieldGroup[];
  message?: string;
  error?: string;
}

export interface CreateMeasurementFieldRequest {
  product_id: number;
  fields: Array<{
    field_name: string;
    field_type: string;
    unit: string;
    is_required: string;
  }>;
}

export const useMeasurementField = (apiEndpoint?: string) => {
  const [measurementFields, setMeasurementFields] = useState<MeasurementFieldGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const baseUrl = apiEndpoint || `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}/measurement-field`;


  // Fetch all measurement fields
  const fetchMeasurementFields = useCallback(async (): Promise<MeasurementFieldResponse> => {
    setLoading(true);
    try {
      const response = await fetch( `${baseUrl}/measurements/all`,
        { credentials: "include" });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        setMeasurementFields(result.data);
        setLoading(false);
        return { success: true, data: result.data, message: result.message };
      } else {
        throw new Error(result.message || 'Failed to fetch measurement fields');
      }
    } catch (error) {
      console.error('Error fetching measurement fields:', error);
      setLoading(false);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }, [baseUrl]);


  // Create measurement field
  const createMeasurementField = useCallback(async (measurementFieldData: CreateMeasurementFieldRequest): Promise<MeasurementFieldResponse> => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/bulk`, {
        method: 'POST',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
          
        },

        body: JSON.stringify(measurementFieldData),
        
      });
      

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      console.log("")
      const result = await response.json();
      console.log("result",result)
      
        // Refresh the data after creation
     await fetchMeasurementFields();
     setLoading(false); 
     return { success: true, message: result.message };
      

    } catch (error) {
      console.error('Error creating measurement field:', error);
      setLoading(false);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create measurement field' 
      };
    }
  }, [baseUrl, fetchMeasurementFields]);



  // Update measurement field
  const updateMeasurementField = useCallback(async (id: number, measurementFieldData: Omit<MeasurementField, 'id' | 'created_at' | 'updated_at'>): Promise<MeasurementFieldResponse> => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/${id}`, {
        credentials: "include",
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(measurementFieldData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // Refresh the data after update
        await fetchMeasurementFields();
        setLoading(false);
        return { success: true, message: result.message };
      } else {
        throw new Error(result.message || 'Failed to update measurement field');
      }
    } catch (error) {
      console.error('Error updating measurement field:', error);
      setLoading(false);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update measurement field' 
      };
    }
  }, [baseUrl, fetchMeasurementFields]);

  // Delete measurement field
  const deleteMeasurementField = useCallback(async (id: number): Promise<MeasurementFieldResponse> => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/${id}`, {
        credentials: "include",
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // Refresh the data after deletion
        await fetchMeasurementFields();
        setLoading(false);
        return { success: true, message: result.message };
      } else {
        throw new Error(result.message || 'Failed to delete measurement field');
      }
    } catch (error) {
      console.error('Error deleting measurement field:', error);
      setLoading(false);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete measurement field' 
      };
    }
  }, [baseUrl, fetchMeasurementFields]);

//   // Fetch measurement fields by product ID
// Fetch measurement fields by product ID - Now returns MeasurementField[] directly
const fetchMeasurementFieldsByProductId = useCallback(async (productId: number): Promise<MeasurementField[]> => {
  setLoading(true);
  try {
    const response = await fetch(`${baseUrl}/measurements/${productId}`, {
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && Array.isArray(result.data)) {
      // Update state with the specific product's measurement fields
      setMeasurementFields(result.data);
      setLoading(false);
      return result.data; // Return the array directly
    } else {
      throw new Error(result.message || 'Failed to fetch measurement fields for product');
    }
  } catch (error) {
    console.error('Error fetching measurement fields by product ID:', error);
    setLoading(false);
    // Return empty array instead of throwing to prevent breaking the form
    return []; 
  }
}, [baseUrl]);

  return {
    measurementFields,
    loading,
    fetchMeasurementFields,
    createMeasurementField,
    updateMeasurementField,
    deleteMeasurementField,
    fetchMeasurementFieldsByProductId
  };

  
};


