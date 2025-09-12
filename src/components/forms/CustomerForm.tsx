"use client";
import React from "react";
import Button from "@/components/ui/button";

interface CustomerFormProps {
  isOpen: boolean;
  title: string;
  formData: {
    customer_type: "individual" | "corporate";
    email: string;
    phone_number: string;
    special_notes: string;
    customer_name: string;
    company_name: string;
    contact_person: string;
    delivery_address: string;
  };
  formErrors: {
    email: string;
    phone_number: string;
    customer_name: string;
    company_name: string;
    contact_person: string;
    delivery_address: string;
  };
  modalMode: "create" | "edit" | "view";
  onClose: () => void;
  onFormDataChange: (data: any) => void;
  onCustomerTypeChange: (type: "individual" | "corporate") => void;
  onSubmit: (e: React.FormEvent) => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  isOpen,
  title,
  formData,
  formErrors,
  modalMode,
  onClose,
  onFormDataChange,
  onCustomerTypeChange,
  onSubmit
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Sliding Form Panel */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4  bg-white">
          <h2 className="text-xl font-semibold text-gray-950">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-900 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          <form onSubmit={onSubmit} className="p-4 space-y-4">
            {/* Customer Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Customer Type *</label>
              <select
                value={formData.customer_type}
                onChange={(e) => onCustomerTypeChange(e.target.value as "individual" | "corporate")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={modalMode === "view"}
                required
              >
                <option value="individual">Individual</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>

            {/* Individual Customer Fields */}
            {formData.customer_type === 'individual' && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Customer Name *</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  placeholder="Enter customer name"
                  onChange={(e) => onFormDataChange({ ...formData, customer_name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    formErrors.customer_name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2`}
                  readOnly={modalMode === "view"}
                  required
                />
                {formErrors.customer_name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.customer_name}</p>
                )}
              </div>
            )}

            {/* Corporate Customer Fields */}
            {formData.customer_type === 'corporate' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Company Name *</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => onFormDataChange({ ...formData, company_name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formErrors.company_name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } focus:outline-none focus:ring-2`}
                    readOnly={modalMode === "view"}
                    required
                  />
                  {formErrors.company_name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.company_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Contact Person *</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => onFormDataChange({ ...formData, contact_person: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formErrors.contact_person ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } focus:outline-none focus:ring-2`}
                    readOnly={modalMode === "view"}
                    required
                  />
                  {formErrors.contact_person && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.contact_person}</p>
                  )}
                </div>
              </>
            )}

            {/* Common Fields */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Email *</label>
              <input
                type="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                readOnly={modalMode === "view"}
                required
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Phone Number *</label>
              <input
                type="tel"
                placeholder="Enter Phone number"
                value={formData.phone_number}
                onChange={(e) => onFormDataChange({ ...formData, phone_number: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.phone_number ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                readOnly={modalMode === "view"}
                required
              />
              {formErrors.phone_number && (
                <p className="mt-1 text-sm text-red-600">{formErrors.phone_number}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Delivery Address *</label>
              <textarea
                placeholder="Enter delivery address"
                value={formData.delivery_address}
                onChange={(e) => onFormDataChange({ ...formData, delivery_address: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.delivery_address ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                rows={3}
                readOnly={modalMode === "view"}
                required
              />
              {formErrors.delivery_address && (
                <p className="mt-1 text-sm text-red-600">{formErrors.delivery_address}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Special Notes</label>
              <textarea
                value={formData.special_notes}
                onChange={(e) => onFormDataChange({ ...formData, special_notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                readOnly={modalMode === "view"}
                placeholder="Enter any special notes"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end pt-6 border-t border-gray-200 space-x-3">
              <Button
                type="button"
                onClick={onClose}
                className="bg-white"
                textColor="text-gray-800"
              >
                Cancel
              </Button>
              {modalMode !== "view" && (
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {modalMode === "create" ? "Create Customer" : "Update Customer"}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CustomerForm;