// hooks/useCashbook.ts
import { useState, useCallback, useMemo } from 'react';

export interface CashBookEntry {
  id: number;
  transaction_type: 'income' | 'expense';
  amount: number;
  description: string;
  transaction_date: string;
  references?: string;
  reference_details?: string;
  special_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferenceEntry {
  id: string;
  type: string; // Added type field for reference categories
  name: string;
  detail: string;
}

export interface CashBookFormData {
  amount: string;
  description: string;
  transaction_date: string;
  references: ReferenceEntry[];
  special_notes: string;
}

export interface CashBookSummary {
  total_income: number;
  total_expense: number;
  net_balance: number;
  running_balance: number;
  period_start: string;
  period_end: string;
  daily_summaries?: Array<{
    date: string;
    total_income: number;
    total_expense: number;
    net_amount: number;
  }>;
}

export interface CashBookSearchFilter {
  start_date?: string;
  end_date?: string;
  transaction_type?: 'income' | 'expense';
  min_amount?: number;
  max_amount?: number;
  description_contains?: string;
  page: number;
  page_size: number;
}

export const useCashbook = (apiEndpoint?: string) => {
  const [entries, setEntries] = useState<CashBookEntry[]>([]);
  const [summary, setSummary] = useState<CashBookSummary>({
    total_income: 0,
    total_expense: 0,
    net_balance: 0,
    running_balance: 0,
    period_start: '',
    period_end: ''
  });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CashBookFormData>({
    amount: "",
    description: "",
    transaction_date: new Date().toISOString().split('T')[0],
    references: [],
    special_notes: ""
  });

  // API Base URL - with fallback - memoized to prevent recreation
  const baseUrl = useMemo(() => {
    if (apiEndpoint) return apiEndpoint;
    
    const host = process.env.NEXT_PUBLIC_BACKEND_HOST || 'localhost';
    const port = process.env.NEXT_PUBLIC_BACKEND_PORT || '8000';
    return `http://${host}:${port}/cashbook`;
  }, [apiEndpoint]);

  // Helper function to handle API errors
  const handleApiError = (error: any, context: string) => {
    console.error(`${context} error:`, error);
    
    if (error.response) {
      // Server responded with error status
      return error.response.data?.detail || `Server error: ${error.response.status}`;
    } else if (error.request) {
      // Request made but no response received
      return 'Network error: Unable to connect to server';
    } else {
      // Something else happened
      return error.message || `Failed to ${context.toLowerCase()}`;
    }
  };

  // Fetch all entries with pagination handling
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      let allEntries: CashBookEntry[] = [];
      let page = 1;
      const pageSize = 100; // Maximum allowed by your API
      let hasMore = true;

      console.log('Fetching entries with pagination...');

      while (hasMore) {
        console.log(`Fetching page ${page} with page_size ${pageSize}`);
        
        const response = await fetch(`${baseUrl}/search?page=${page}&page_size=${pageSize}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Page ${page} response:`, data);
        
        // Handle the correct response structure from your Pydantic model
        const entriesData = data.entries || [];
        allEntries = [...allEntries, ...entriesData];
        
        // Check if there are more pages
        const pagination = data.pagination;
        hasMore = pagination && pagination.has_next;
        page++;
        
        // Safety break to prevent infinite loops
        if (page > 100) {
          console.warn('Reached maximum page limit (100), breaking loop');
          break;
        }
      }
      
      console.log(`Fetched total of ${allEntries.length} entries`);
      setEntries(allEntries);
      
      return { success: true };
    } catch (error) {
      console.error('Fetch entries error:', error);
      const errorMessage = handleApiError(error, 'Fetch entries');
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  // Fetch summary data with corrected field mapping
const fetchSummary = useCallback(async (startDate: string, endDate: string) => {
  try {
    const response = await fetch(`${baseUrl}/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Map the response to match your frontend interface
    setSummary({
      total_income: data.total_income || 0,
      total_expense: data.total_expense || 0,
      net_balance: data.net_profit_loss || 0, // Backend uses net_profit_loss
      running_balance: data.running_balance || 0,
      period_start: startDate,
      period_end: endDate,
      daily_summaries: data.daily_summaries || []
    });
    
    // Return the raw data for the CashSummarySection
    return { 
      success: true, 
      data: data // Return the raw backend response
    };
  } catch (error) {
    console.error('Fetch summary error:', error);
    return { 
      success: false, 
      error: handleApiError(error, 'Fetch summary')
    };
  }
}, [baseUrl]);


  // Create income entry
  const createIncomeEntry = useCallback(async () => {
    setLoading(true);
    try {
      const requestBody = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        transaction_date: formData.transaction_date,
        references: formData.references.length > 0 ? JSON.stringify(formData.references) : null,
        reference_details: formData.references.length > 0 
          ? formData.references.map(ref => `${ref.name}: ${ref.detail}`).join('; ') 
          : null,
        special_notes: formData.special_notes || null
      };

      console.log('Creating income entry:', requestBody);

      const response = await fetch(`${baseUrl}/income`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Create income error response:', errorData);
        
        try {
          const parsedError = JSON.parse(errorData);
          throw new Error(parsedError.detail || 'Failed to create income entry');
        } catch {
          throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }
      }

      const newEntry = await response.json();
      setEntries(prev => [newEntry, ...prev]);
      
      // Reset form
      setFormData({
        amount: "",
        description: "",
        transaction_date: new Date().toISOString().split('T')[0],
        references: [],
        special_notes: ""
      });

      return { success: true };
    } catch (error) {
      console.error('Create income error:', error);
      return { 
        success: false, 
        error: handleApiError(error, 'Create income entry')
      };
    } finally {
      setLoading(false);
    }
  }, [baseUrl, formData]);

  // Create expense entry
  const createExpenseEntry = useCallback(async () => {
    setLoading(true);
    try {
      const requestBody = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        transaction_date: formData.transaction_date,
        references: formData.references.length > 0 ? JSON.stringify(formData.references) : null,
        reference_details: formData.references.length > 0 
          ? formData.references.map(ref => `${ref.name}: ${ref.detail}`).join('; ') 
          : null,
        special_notes: formData.special_notes || null
      };

      console.log('Creating expense entry:', requestBody);

      const response = await fetch(`${baseUrl}/expense`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Create expense error response:', errorData);
        
        try {
          const parsedError = JSON.parse(errorData);
          throw new Error(parsedError.detail || 'Failed to create expense entry');
        } catch {
          throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }
      }

      const newEntry = await response.json();
      setEntries(prev => [newEntry, ...prev]);
      
      // Reset form
      setFormData({
        amount: "",
        description: "",
        transaction_date: new Date().toISOString().split('T')[0],
        references: [],
        special_notes: ""
      });

      return { success: true };
    } catch (error) {
      console.error('Create expense error:', error);
      return { 
        success: false, 
        error: handleApiError(error, 'Create expense entry')
      };
    } finally {
      setLoading(false);
    }
  }, [baseUrl, formData]);

  // Update entry - IMPROVED VERSION
  const updateEntry = useCallback(async (entryId: number, updateData: Partial<CashBookFormData>) => {
    setLoading(true);
    try {
      // Build request body with proper typing
      const requestBody: {
        amount?: number;
        description?: string;
        transaction_date?: string;
        references?: string | null;
        reference_details?: string | null;
        special_notes?: string | null;
      } = {};

      // Only include fields that have values
      if (updateData.amount && updateData.amount.trim()) {
        requestBody.amount = parseFloat(updateData.amount);
      }
      
      if (updateData.description !== undefined) {
        requestBody.description = updateData.description.trim();
      }
      
      if (updateData.transaction_date) {
        requestBody.transaction_date = updateData.transaction_date;
      }
      
      if (updateData.references !== undefined) {
        if (updateData.references.length > 0) {
          requestBody.references = JSON.stringify(updateData.references);
          requestBody.reference_details = updateData.references.map(ref => `${ref.name}: ${ref.detail}`).join('; ');
        } else {
          requestBody.references = null;
          requestBody.reference_details = null;
        }
      }
      
      if (updateData.special_notes !== undefined) {
        requestBody.special_notes = updateData.special_notes || null;
      }

      console.log('Updating entry:', { entryId, requestBody });

      const response = await fetch(`${baseUrl}/entries/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Update entry error response:', errorData);
        
        try {
          const parsedError = JSON.parse(errorData);
          throw new Error(parsedError.detail || 'Failed to update entry');
        } catch {
          throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }
      }

      const updatedEntry = await response.json();
      console.log('Entry updated successfully:', updatedEntry);
      
      // Update the entry in the local state
      setEntries(prev => prev.map(entry => 
        entry.id === entryId ? updatedEntry : entry
      ));

      return { success: true, data: updatedEntry };
    } catch (error) {
      console.error('Update entry error:', error);
      return { 
        success: false, 
        error: handleApiError(error, 'Update entry')
      };
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  // Delete entry - IMPROVED VERSION
  const deleteEntry = useCallback(async (entryId: number) => {
    try {
      console.log('Deleting entry with ID:', entryId);

      const response = await fetch(`${baseUrl}/entries/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete entry error response:', errorText);
        
        if (response.status === 404) {
          throw new Error('Entry not found');
        }
        
        try {
          const parsedError = JSON.parse(errorText);
          throw new Error(parsedError.detail || `API Error: ${response.status} - ${response.statusText}`);
        } catch {
          throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }
      }

      console.log('Entry deleted successfully');
      
      // Remove the entry from local state
      setEntries(prev => prev.filter(entry => entry.id !== entryId));
      
      return { success: true };
    } catch (error) {
      console.error('Delete entry error:', error);
      return { 
        success: false, 
        error: handleApiError(error, 'Delete entry')
      };
    }
  }, [baseUrl]);

  // Get entry by ID
  const getEntryById = useCallback(async (entryId: number) => {
    try {
      const response = await fetch(`${baseUrl}/entries/${entryId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Entry not found');
        }
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }
      const entry = await response.json();
      return { success: true, data: entry };
    } catch (error) {
      console.error('Get entry error:', error);
      return { 
        success: false, 
        error: handleApiError(error, 'Fetch entry')
      };
    }
  }, [baseUrl]);



  // Search entries with filters - respecting page_size limit
  const searchEntries = useCallback(async (searchFilter: CashBookSearchFilter) => {
    setLoading(true);
    try {
      // Ensure page_size doesn't exceed API limit
      const safePageSize = Math.min(searchFilter.page_size, 100);
      
      const params = new URLSearchParams();
      
      if (searchFilter.start_date) params.append('start_date', searchFilter.start_date);
      if (searchFilter.end_date) params.append('end_date', searchFilter.end_date);
      if (searchFilter.transaction_type) params.append('transaction_type', searchFilter.transaction_type);
      if (searchFilter.min_amount) params.append('min_amount', searchFilter.min_amount.toString());
      if (searchFilter.max_amount) params.append('max_amount', searchFilter.max_amount.toString());
      if (searchFilter.description_contains) params.append('description_contains', searchFilter.description_contains);
      params.append('page', searchFilter.page.toString());
      params.append('page_size', safePageSize.toString());

      const response = await fetch(`${baseUrl}/search?${params}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return { 
        success: true, 
        data: {
          entries: data.entries || [],
          pagination: data.pagination || {
            current_page: 1,
            page_size: safePageSize,
            total_entries: 0,
            total_pages: 0,
            has_next: false,
            has_prev: false
          }
        }
      };
    } catch (error) {
      console.error('Search entries error:', error);
      return { 
        success: false, 
        error: handleApiError(error, 'Search entries')
      };
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  return {
    entries,
    setEntries,
    summary,
    setSummary,
    loading,
    formData,
    setFormData,
    fetchEntries,
    fetchSummary,
    createIncomeEntry,
    createExpenseEntry,
    updateEntry,
    deleteEntry,
    getEntryById,
    searchEntries
  };
};