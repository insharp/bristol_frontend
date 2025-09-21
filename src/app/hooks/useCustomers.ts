import { useState, useEffect } from 'react';

interface BaseCustomer {
  id: string;
  customer_type: "individual" | "corporate";
  email: string;
  phone_number: string;
  special_notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface IndividualCustomer extends BaseCustomer {
  customer_type: "individual";
  customer_name: string;
  delivery_address?: string;
}

interface CorporateCustomer extends BaseCustomer {
  customer_type: "corporate";
  company_name: string;
  contact_person: string;
  delivery_address: string;
}

export type Customer = IndividualCustomer | CorporateCustomer;
export type CustomerType = "all" | "individual" | "corporate";

export const useCustomers = (apiEndpoint?: string) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<CustomerType>("individual");

  // Use custom endpoint or default
  const baseUrl = apiEndpoint || 
    `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}`;

  const fetchCustomers = async (customerType: CustomerType = selectedType) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (customerType !== "all") {
        params.append("customer_type", customerType);
      }
      
      const queryString = params.toString();
      const res = await fetch(
        `${baseUrl}/customer${queryString ? `?${queryString}` : ""}`,
        { credentials: "include" }
      );
      
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.data || data);
        return { success: true, data: data.data || data };
      } else {
        return { success: false, error: 'Failed to load customers' };
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      return { success: false, error: 'Connection error' };
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (formData: any) => {
    try {
      const requestData = {
        customer_type: formData.customer_type,
        email: formData.email,
        phone_number: formData.phone_number,
        special_notes: formData.special_notes,
        delivery_address: formData.delivery_address,
        ...(formData.customer_type === 'individual' 
          ? { customer_name: formData.customer_name }
          : {
              company_name: formData.company_name,
              contact_person: formData.contact_person
            }
        )
      };

      const endpoint = formData.customer_type === 'individual' ? 'customer/individual' : 'customer/corporate';
        
      const res = await fetch(
        `${baseUrl}/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(requestData),
        }
      );

      if (res.ok) {
        await fetchCustomers();
        return { success: true, message: 'Customer created successfully' };
      } else {
        const errorData = await res.json();
        return { success: false, error: errorData.message || 'Failed to create customer' };
      }
    } catch (err) {
      console.error('Create customer exception:', err);
      return { success: false, error: 'Unable to create customer' };
    }
  };

const updateCustomer = async (customerId: string, formData: any) => {
  try {
    // Convert string ID to integer for backend
    const customerIdInt = parseInt(customerId, 10);
    
    if (isNaN(customerIdInt)) {
      return { success: false, error: 'Invalid customer ID format' };
    }
    
    const requestData = {
      customer_type: formData.customer_type,
      email: formData.email,
      phone_number: formData.phone_number,
      special_notes: formData.special_notes,
      delivery_address: formData.delivery_address,
      ...(formData.customer_type === 'individual' 
        ? { customer_name: formData.customer_name }
        : {
            company_name: formData.company_name,
            contact_person: formData.contact_person
          }
      )
    };

    const res = await fetch(
      `${baseUrl}/customer/${customerIdInt}`, // Use integer ID
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestData),
      }
    );
    
    if (res.ok) {
      await fetchCustomers();
      return { success: true, message: 'Customer updated successfully' };
    } else {
      const errorData = await res.json();
      return { success: false, error: errorData.detail || errorData.message || 'Failed to update customer' };
    }
  } catch (err) {
    console.error('Update customer exception:', err);
    return { success: false, error: 'Unable to update customer' };
  }
};

// Replace your deleteCustomer function with this comprehensive debug version:

const deleteCustomer = async (customerId: string) => {
  try {
    console.log('=== COMPREHENSIVE DELETE DEBUG ===');
    console.log('1. Original customerId:', customerId, typeof customerId);
    
    // Check what customers we have
    console.log('2. Current customers in state:', customers.map(c => ({ id: c.id, type: typeof c.id })));
    
    // Find the customer in our state
    const customerInState = customers.find(c => c.id === customerId);
    console.log('3. Customer found in state:', customerInState);
    
    if (!customerInState) {
      console.error('Customer not found in frontend state!');
      return { success: false, error: 'Customer not found in frontend state' };
    }
    
    // Convert to integer
    const customerIdInt = parseInt(customerId, 10);
    console.log('4. Converted to int:', customerIdInt, typeof customerIdInt);
    
    if (isNaN(customerIdInt)) {
      console.error('Invalid customer ID conversion');
      return { success: false, error: 'Invalid customer ID format' };
    }
    
    const fullUrl = `${baseUrl}/customer/${customerIdInt}`;
    console.log('5. Full URL:', fullUrl);
    console.log('6. Base URL:', baseUrl);
    
    // Test if the customer exists with a GET request first
    console.log('7. Testing GET request first...');
    const testRes = await fetch(fullUrl, {
      method: "GET",
      credentials: "include",
    });
    console.log('8. GET test status:', testRes.status);
    
    if (!testRes.ok) {
      const testError = await testRes.text();
      console.log('9. GET test error:', testError);
      return { success: false, error: `Customer not found on server: ${testError}` };
    }
    
    // Now try the actual delete
    console.log('10. Proceeding with DELETE...');
    const res = await fetch(fullUrl, {
      method: "DELETE",
      credentials: "include",
    });
    
    console.log('11. DELETE response status:', res.status);
    console.log('12. DELETE response ok:', res.ok);
    
    const responseText = await res.text();
    console.log('13. DELETE response body:', responseText);
    
    if (res.ok) {
      console.log('14. Delete successful, fetching customers...');
      await fetchCustomers();
      return { success: true, message: 'Customer deleted successfully' };
    } else {
      let errorMessage = 'Failed to delete customer';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = responseText || `HTTP ${res.status}: ${res.statusText}`;
      }
      
      console.log('15. Delete failed with error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  } catch (err) {
    console.error('16. Delete customer network error:', err);
    return { success: false, error: 'Network error: Unable to delete customer' };
  }
};

  return {
    customers,
    loading,
    selectedType,
    setSelectedType,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
  };
};