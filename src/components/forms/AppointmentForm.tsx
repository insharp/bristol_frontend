import React from "react";
import Button from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Customer, FormData } from "@/app/hooks/useAppointment";

interface Order {
  id: string | number;
  order_number: string;
}

interface AppointmentFormProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  customers: Customer[];
  orders: Order[];
  modalMode: "create" | "edit" | "view";
  loading: boolean;
  formErrors: {
    customer_id: string;
    order_id: string;
    appointment_type: string;
    appointment_date: string;
    appointment_time: string;
  };
  onSubmit: (e: React.FormEvent) => void;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
  permissions?: {
    canEdit?: boolean;
    canDelete?: boolean;
  };
}

// Helper function specifically for dropdown to show batch names when needed
const getCustomerDropdownName = (customer: any) => {
  if (!customer) return 'Unknown Customer';
  
  let baseName = '';
  
  if (customer.customer_type === 'corporate') {
    baseName = customer.company_name || `Corporate Customer #${customer.id}`;
  } else {
    baseName = customer.customer_name || `Customer #${customer.id}`;
  }
  
  // Add batch name if it exists to differentiate similar names
  if (customer.batch_name) {
    return `${baseName} - ${customer.batch_name}`;
  }
  
  return baseName;
};


const today = new Date().toISOString().split('T')[0];

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  formData,
  setFormData,
  customers,
  orders,
  modalMode,
  loading,
  formErrors,
  onSubmit,
  onEditClick,
  onDeleteClick,
  permissions = { canEdit: true, canDelete: true }
}) => {
  return (
    <form onSubmit={onSubmit} className="p-6 space-y-4">
      {/* Customer Selection with Enhanced Display */}
      <div>
        <label className="block text-sm font-medium mb-2">Customer *</label>
        <select
          value={formData.customer_id}
          onChange={(e) => {
            const selectedValue = e.target.value;
            setFormData({ 
              ...formData, 
              customer_id: selectedValue, // Store the full unique identifier (customerId|batchId)
              order_id: "" 
            });
          }}
          className={`w-full px-3 py-2 border rounded-lg ${
            formErrors.customer_id ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
          } focus:outline-none focus:ring-2`}
          disabled={modalMode === "view"}
          required
        >
          <option value="">Select Customer</option>
          {customers.map((customer) => (
            <option 
              key={customer.unique_key} // Use unique_key for React key
              value={`${customer.id}|${customer.batch_measurement_id || 'none'}`} // Pass both customer ID and batch ID
            >
              {getCustomerDropdownName(customer)}
            </option>
          ))}
        </select>
        {formErrors.customer_id && (
          <p className="mt-1 text-sm text-red-600">{formErrors.customer_id}</p>
        )}
      </div>

      {/* Order Selection - Filtered by customer */}
      <div>
        <label className="block text-sm font-medium mb-2">Order *</label>
        <select
          value={formData.order_id}
          onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg ${
            formErrors.order_id ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
          } focus:outline-none focus:ring-2`}
          disabled={modalMode === "view" || !formData.customer_id}
          required
        >
          <option value="">
            {!formData.customer_id ? "Select a customer first" : "Select Order"}
          </option>
          {orders.map((order) => (
            <option key={order.id} value={order.id}>
              {order.order_number}
            </option>
          ))}
        </select>
        {formErrors.order_id && (
          <p className="mt-1 text-sm text-red-600">{formErrors.order_id}</p>
        )}
        {formData.customer_id && orders.length === 0 && (
          <p className="mt-1 text-sm text-amber-600">No orders found for this customer</p>
        )}
      </div>

      {/* Appointment Type */}
      <div>
        <label className="block text-sm font-medium mb-2">Appointment Type *</label>
        <select
          value={formData.appointment_type}
          onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value as any })}
          className={`w-full px-3 py-2 border rounded-lg ${
            formErrors.appointment_type ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
          } focus:outline-none focus:ring-2`}
          disabled={modalMode === "view"}
          required
        >
          <option value="">Select Type</option>
          <option value="fitting">Fitting</option>
          <option value="pickup">Pickup</option>
        </select>
        {formErrors.appointment_type && (
          <p className="mt-1 text-sm text-red-600">{formErrors.appointment_type}</p>
        )}
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Date *</label>
          {modalMode === "view" ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              {formData.appointment_date ? 
                new Date(formData.appointment_date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric"
                }) : 'No date selected'
              }
            </div>
          ) : (
            <input
              type="date"
              value={formData.appointment_date}
              onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
              min={modalMode === "create" ? today : undefined}
              className={`w-full px-3 py-2 border rounded-lg ${
                formErrors.appointment_date ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              } focus:outline-none focus:ring-2`}
              required
            />
          )}
          {formErrors.appointment_date && (
            <p className="mt-1 text-sm text-red-600">{formErrors.appointment_date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Time *</label>
          {modalMode === "view" ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              {formData.appointment_time ? (() => {
                const [hours, minutes] = formData.appointment_time.split(":");
                const hour = parseInt(hours);
                const ampm = hour >= 12 ? "PM" : "AM";
                const displayHour = hour % 12 || 12;
                return `${displayHour}:${minutes} ${ampm}`;
              })() : 'No time selected'}
            </div>
          ) : (
            <input
              type="time"
              value={formData.appointment_time}
              onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${
                formErrors.appointment_time ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              } focus:outline-none focus:ring-2`}
              required
            />
          )}
          {formErrors.appointment_time && (
            <p className="mt-1 text-sm text-red-600">{formErrors.appointment_time}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-2">Notes</label>
        {modalMode === "view" ? (
          <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 min-h-[80px]">
            {formData.notes || 'No notes provided'}
          </div>
        ) : (
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Optional notes about the appointment..."
          />
        )}
      </div>

      {/* Button Section */}
      <div className="flex justify-end pt-4 gap-3">
        {modalMode === "view" ? (
          <>
            {permissions.canDelete && onDeleteClick && (
              <Button 
                type="button"
                onClick={onDeleteClick}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            )}
            {permissions.canEdit && onEditClick && (
              <Button 
                type="button"
                onClick={onEditClick}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Edit
              </Button>
            )}
          </>
        ) : (
          <Button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                {modalMode === "create" ? "Scheduling..." : "Updating..."}
              </>
            ) : (
              modalMode === "create" ? "Schedule Appointment" : "Update Appointment"
            )}
          </Button>
        )}
      </div>
    </form>
  );
};

export default AppointmentForm;