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
  const [selectedType, setSelectedType] = useState<CustomerType>("all");

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
        ...(formData.customer_type === 'individual' 
          ? { customer_name: formData.customer_name }
          : {
              company_name: formData.company_name,
              contact_person: formData.contact_person,
              delivery_address: formData.delivery_address
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
      return { success: false, error: 'Unable to create customer' };
    }
  };

  const updateCustomer = async (customerId: string, formData: any) => {
    try {
      const requestData = {
        customer_type: formData.customer_type,
        email: formData.email,
        phone_number: formData.phone_number,
        special_notes: formData.special_notes,
        ...(formData.customer_type === 'individual' 
          ? { customer_name: formData.customer_name }
          : {
              company_name: formData.company_name,
              contact_person: formData.contact_person,
              delivery_address: formData.delivery_address
            }
        )
      };

      const res = await fetch(
        `${baseUrl}/customer/${customerId}`,
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
        return { success: false, error: errorData.message || 'Failed to update customer' };
      }
    } catch (err) {
      return { success: false, error: 'Unable to update customer' };
    }
  };

  const deleteCustomer = async (customerId: string) => {
    try {
      const res = await fetch(
        `${baseUrl}/customer/${customerId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      
      if (res.ok) {
        await fetchCustomers();
        return { success: true, message: 'Customer deleted successfully' };
      } else {
        const errorData = await res.json();
        return { success: false, error: errorData.message || 'Failed to delete customer' };
      }
    } catch (err) {
      return { success: false, error: 'Unable to delete customer' };
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