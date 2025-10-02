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
  const [error, setError] = useState<string | null>(null);

  const baseUrl = apiEndpoint || `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}/measurement-field`;

  // Clear error helper
  const clearError = () => setError(null);

  // Fetch all measurement fields
  const fetchMeasurementFields = useCallback(async (): Promise<MeasurementFieldResponse> => {
    setLoading(true);
    clearError();
    try {
      const response = await fetch(`${baseUrl}/measurements/all`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setMeasurementFields(result.data);
        return { success: true, data: result.data, message: result.message };
      } else {
        throw new Error(result.message || 'Failed to fetch measurement fields');
      }
    } catch (error) {
      console.error('Error fetching measurement fields:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  // Create measurement field
  const createMeasurementField = useCallback(async (measurementFieldData: CreateMeasurementFieldRequest): Promise<MeasurementFieldResponse> => {
    setLoading(true);
    clearError();
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
      
      const result = await response.json();
      
      // Refresh the data after creation
      await fetchMeasurementFields();
      return { success: true, message: result.message };

    } catch (error) {
      console.error('Error creating measurement field:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create measurement field';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [baseUrl, fetchMeasurementFields]);

  // Updated and simplified updateMeasurementField function
  const updateMeasurementField = useCallback(async (
    id: number, 
    measurementFieldData: Omit<MeasurementField, 'id' | 'created_at' | 'updated_at'>
  ): Promise<MeasurementFieldResponse> => {
    setLoading(true);
    clearError();
    
    try {
      console.log('=== UPDATE MEASUREMENT FIELD ===');
      console.log('ID:', id);
      console.log('Update Data:', measurementFieldData);
      console.log('API URL:', `${baseUrl}/${id}`);

      const response = await fetch(`${baseUrl}/${id}`, {
        method: 'PUT',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(measurementFieldData),
      });

      console.log('Response Status:', response.status);
      console.log('Response OK:', response.ok);

      // Handle different response scenarios
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // If we can't parse the error response, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      // Try to parse the response
      let result;
      try {
        const responseText = await response.text();
        console.log('Response Text:', responseText);
        
        if (responseText.trim()) {
          result = JSON.parse(responseText);
          console.log('Parsed Result:', result);
        } else {
          // Empty response body but successful HTTP status
          result = { success: true, message: 'Updated successfully' };
        }
      } catch (parseError) {
        console.warn('Could not parse response as JSON, treating as success');
        result = { success: true, message: 'Updated successfully' };
      }

      // Handle different result structures
      const isSuccess = result.success !== false; // Treat undefined success as true
      
      if (isSuccess) {
        // Refresh data after successful update
        await fetchMeasurementFields();
        return { 
          success: true, 
          message: result.message || 'Measurement field updated successfully' 
        };
      } else {
        throw new Error(result.message || result.error || 'Update failed');
      }

    } catch (error) {
      console.error('Error updating measurement field:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update measurement field';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [baseUrl, fetchMeasurementFields]);

  // Delete measurement field
  const deleteMeasurementField = useCallback(async (id: number): Promise<MeasurementFieldResponse> => {
    setLoading(true);
    clearError();
    try {
      const response = await fetch(`${baseUrl}/${id}`, {
        method: 'DELETE',
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // Refresh the data after deletion
        await fetchMeasurementFields();
        return { success: true, message: result.message };
      } else {
        throw new Error(result.message || 'Failed to delete measurement field');
      }
    } catch (error) {
      console.error('Error deleting measurement field:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete measurement field';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [baseUrl, fetchMeasurementFields]);

  // Fetch measurement fields by product ID
  const fetchMeasurementFieldsByProductId = useCallback(async (productId: number): Promise<MeasurementField[]> => {
    setLoading(true);
    clearError();
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
        return result.data; // Return the array directly
      } else {
        throw new Error(result.message || 'Failed to fetch measurement fields for product');
      }
    } catch (error) {
      console.error('Error fetching measurement fields by product ID:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch measurement fields';
      setError(errorMessage);
      // Return empty array instead of throwing to prevent breaking the form
      return []; 
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  return {
    measurementFields,
    loading,
    error,
    clearError,
    fetchMeasurementFields,
    createMeasurementField,
    updateMeasurementField,
    deleteMeasurementField,
    fetchMeasurementFieldsByProductId
  };
};