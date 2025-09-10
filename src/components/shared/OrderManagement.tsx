"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import ReusableTable from "@/components/ui/ReusableTable";
import SlideModal from "@/components/ui/SlideModal";
import { useSingleOrders, SingleOrder, FormData } from "@/app/hooks/useOrder";
import { Plus, RefreshCw, X, Eye, Edit, Trash2 } from "lucide-react";

interface OrderManagementProps {
  title?: string;
  apiEndpoint?: string;
  permissions?: {
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canView?: boolean;
  };
}

// Message Modal Component
const MessageModal = ({
  isOpen,
  onClose,
  type,
  title,
  message
}: {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  title: string;
  message: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-blue-50/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center mb-4">
            {type === 'success' ? (
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex justify-end">
            <Button
              onClick={onClose}
              className={`${
                type === 'success' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              } text-white`}
            >
              OK
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderManagement: React.FC<OrderManagementProps> = ({
  title = "Orders",
  apiEndpoint,
  permissions = { canCreate: true, canEdit: true, canDelete: true, canView: true }
}) => {
  const {
    orders,
    customers,
    loading,
    formData,
    setFormData,
    fetchOrders,
    fetchCustomers,
    createOrder,
    updateOrder,
    deleteOrder
  } = useSingleOrders(apiEndpoint);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedOrder, setSelectedOrder] = useState<SingleOrder | null>(null);

  // Message Modal State
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: ''
  });

  const showSuccessMessage = (title: string, message: string) => {
    setMessageModal({ isOpen: true, type: 'success', title, message });
  };

  const showErrorMessage = (title: string, message: string) => {
    setMessageModal({ isOpen: true, type: 'error', title, message });
  };

  const closeMessageModal = () => {
    setMessageModal({ ...messageModal, isOpen: false });
  };

  useEffect(() => {
    fetchCustomers();
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    return (
      order.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Modal handlers
  const openCreateModal = () => {
    setSelectedOrder(null);
    setFormData({
      customer_id: "",
      order_type: "single",
      product: "",
      quantity: "",
      unit_price: "",
      style_preferences: "",
      special_notes: "",
      status: undefined,
    });
    setModalMode("create");
    setIsModalOpen(true);
  };

  const openEditModal = (order: SingleOrder) => {
    setSelectedOrder(order);
    setFormData({
      customer_id: order.customer_id.toString(),
      order_type: order.order_type,
      product: order.product,
      quantity: order.quantity.toString(),
      unit_price: order.unit_price.toString(),
      style_preferences: order.style_preferences || "",
      special_notes: order.special_notes || "",
      status: order.status,
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === "create") {
      const result = await createOrder();
      if (result.success) {
        showSuccessMessage("Success", "Order created successfully!");
        closeModal();
      } else {
        showErrorMessage("Error", result.error || "Failed to create order");
      }
    } else if (modalMode === "edit" && selectedOrder) {
      const result = await updateOrder(selectedOrder.id, formData);
      if (result.success) {
        showSuccessMessage("Success", "Order updated successfully!");
        closeModal();
      } else {
        showErrorMessage("Error", result.error || "Failed to update order");
      }
    }
  };

  const handleDelete = async (order: SingleOrder) => {
    if (window.confirm(`Are you sure you want to delete this order?`)) {
      const result = await deleteOrder(order.id);
      if (result.success) {
        showSuccessMessage("Deleted", "Order deleted successfully!");
      } else {
        showErrorMessage("Error", result.error || "Failed to delete order");
      }
    }
  };

  // Table columns
  const columns = [
    { key: "id", label: "Order ID", width: "100px" },
    { key: "customer_name", label: "Customer", minWidth: "200px" },
    { key: "product", label: "Product", minWidth: "150px" },
    { key: "quantity", label: "Quantity", width: "100px" },
    { key: "unit_price", label: "Unit Price", width: "120px" },
    { key: "status", label: "Status", width: "150px" },
  ];

  // Table actions with icons
  const getActions = () => {
    if (!permissions.canView && !permissions.canEdit && !permissions.canDelete) return [];
    
    return filteredOrders.map(order => {
      const actions = [];

      if (permissions.canView) {
        actions.push({
          label: "View",
          icon: <Eye className="w-4 h-4" />,
          onClick: () => openEditModal(order)
        });
      }

      if (permissions.canEdit) {
        actions.push({
          label: "Edit",
          icon: <Edit className="w-4 h-4" />,
          onClick: () => openEditModal(order)
        });
      }

      if (permissions.canDelete) {
        actions.push({
          label: "Delete",
          icon: <Trash2 className="w-4 h-4" />,
          onClick: () => handleDelete(order),
          className: "text-red-600 hover:bg-red-50"
        });
      }

      return actions;
    }).flat();
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <main className="flex-1 p-6 bg-gray-50 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {permissions.canCreate && (
            <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
              + Add Order
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex-1 min-h-0 bg-white rounded-lg border border-gray-200">
          <ReusableTable
            data={filteredOrders}
            columns={columns}
            actions={getActions()}
            loading={loading}
            emptyMessage="No orders found."
          />
        </div>

        {/* Modal */}
        <SlideModal isOpen={isModalOpen} onClose={closeModal} title={modalMode === "create" ? "Create Order" : "Edit Order"}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Customer *</label>
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={modalMode === "edit"}
              >
                <option value="">Select Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Product *</label>
              <input
                type="text"
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Quantity *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Unit Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Style Preferences</label>
              <textarea
                value={formData.style_preferences}
                onChange={(e) => setFormData({ ...formData, style_preferences: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Special Notes</label>
              <textarea
                value={formData.special_notes}
                onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {modalMode === "create" ? "Create Order" : "Update Order"}
              </Button>
            </div>
          </form>
        </SlideModal>

        {/* Message Modal */}
        <MessageModal
          isOpen={messageModal.isOpen}
          onClose={closeMessageModal}
          type={messageModal.type}
          title={messageModal.title}
          message={messageModal.message}
        />
      </main>
    </div>
  );
};

export default OrderManagement;
