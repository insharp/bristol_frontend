"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import ReusableTable from "@/components/ui/ReusableTable";
import SlideModal from "@/components/ui/SlideModal";
import { useOrder, SingleOrderResponse, Customer, Product, OrderStatus } from "@/app/hooks/useOrder";
import { Plus, RefreshCw, Eye, Pencil, Trash } from "lucide-react";

// 🔹 Message Modal Component
const MessageModal = ({
  isOpen,
  onClose,
  type,
  title,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  type: "success" | "error";
  title: string;
  message: string;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-blue-50/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center mb-4">
            {type === "success" ? (
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">✅</div>
            ) : (
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">❌</div>
            )}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex justify-end">
            <Button
              onClick={onClose}
              className={`${type === "success" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white`}
            >
              OK
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface Props {
  title?: string;
}

const SingleOrderManagement: React.FC<Props> = ({ title }) => {
  const {
    singleOrders,
    customers,
    products,
    loading,
    fetchCustomers,
    fetchProducts,
    getAllSingleOrders,
    createSingleOrder,
    updateSingleOrder,
    deleteSingleOrder,
  } = useOrder();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedOrder, setSelectedOrder] = useState<SingleOrderResponse | null>(null);

  // ✅ keep form state user-friendly (strings)
  const [formData, setFormData] = useState({
    customer_id: "",
    product_id: "",
    unit_price: "",
    quantity: "1",
    style_preferences: "",
    status: "order_confirmed",
  });

  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    type: "success" as "success" | "error",
    title: "",
    message: "",
  });

  const showMessage = (type: "success" | "error", title: string, message: string) => {
    setMessageModal({ isOpen: true, type, title, message });
  };
  const closeMessageModal = () => setMessageModal({ ...messageModal, isOpen: false });

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    getAllSingleOrders();
  }, []);

  // 🔹 Table columns
  const columns = [
    { key: "id", label: "Order ID" },
    {
      key: "customerid",
      label: "Customer",
      render: (value: any) => customers.find((c: Customer) => c.id === Number(value))?.name || `Customer ${value}`,
    },
    {
      key: "productid",
      label: "Product",
      render: (value: any) => products.find((p: Product) => p.id === Number(value))?.name || `Product ${value}`,
    },
    { key: "unitprice", label: "Unit Price" },
    { key: "stylepreference", label: "Style" },
    { key: "status", label: "Status" },
  ];

  // 🔹 Actions
  const actions = [
    {
      label: "View",
      icon: <Eye className="w-4 h-4" />,
      onClick: (order: SingleOrderResponse) => {
        setSelectedOrder(order);
        setFormData({
          customer_id: order.customerid.toString(),
          product_id: order.productid.toString(),
          unit_price: order.unitprice.toString(),
          quantity: order.quantity.toString(),
          style_preferences: order.stylepreference || "",
          status: order.status,
        });
        setModalMode("view");
        setIsModalOpen(true);
      },
    },
    {
      label: "Edit",
      icon: <Pencil className="w-4 h-4" />,
      onClick: (order: SingleOrderResponse) => {
        setSelectedOrder(order);
        setFormData({
          customer_id: order.customerid.toString(),
          product_id: order.productid.toString(),
          unit_price: order.unitprice.toString(),
          quantity: order.quantity.toString(),
          style_preferences: order.stylepreference || "",
          status: order.status,
        });
        setModalMode("edit");
        setIsModalOpen(true);
      },
    },
    {
      label: "Delete",
      icon: <Trash className="w-4 h-4" />,
      className: "text-red-600",
      onClick: async (order: SingleOrderResponse) => {
        if (window.confirm("Are you sure you want to delete this order?")) {
          const ok = await deleteSingleOrder(order.id);
          if (ok) {
            showMessage("success", "Deleted", "Order deleted successfully");
            getAllSingleOrders();
          } else {
            showMessage("error", "Error", "Delete failed");
          }
        }
      },
    },
  ];

  const openCreateModal = () => {
    setFormData({
      customer_id: "",
      product_id: "",
      unit_price: "",
      quantity: "1",
      style_preferences: "",
      status: "order_confirmed",
    });
    setModalMode("create");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔄 transform formData to API payload
    const payload = {
      customerid: parseInt(formData.customer_id),
      productid: parseInt(formData.product_id),
      unitprice: parseFloat(formData.unit_price),
      quantity: parseInt(formData.quantity),
      stylepreference: formData.style_preferences,
      status: formData.status as OrderStatus,
    };

    if (modalMode === "create") {
      const res = await createSingleOrder(payload);
      if (res) {
        closeModal();
        showMessage("success", "Created", "Order created successfully");
        getAllSingleOrders();
      } else {
        showMessage("error", "Error", "Creation failed");
      }
    } else if (modalMode === "edit" && selectedOrder) {
      const res = await updateSingleOrder(selectedOrder.id, payload);
      if (res) {
        closeModal();
        showMessage("success", "Updated", "Order updated successfully");
        getAllSingleOrders();
      } else {
        showMessage("error", "Error", "Update failed");
      }
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <main className="flex-1 p-6 bg-gray-50 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{title || "Single Orders"}</h1>
          <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Order
          </Button>
        </div>

        <div className="flex-1 bg-white rounded-lg border border-gray-200">
          <ReusableTable data={singleOrders} columns={columns} actions={actions} loading={loading} emptyMessage="No orders found." />
        </div>

        <SlideModal isOpen={isModalOpen} onClose={closeModal} title={modalMode === "create" ? "Add New Order" : modalMode === "edit" ? "Edit Order" : "View Order"}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Customer */}
            <div>
              <label className="block text-sm font-medium mb-2">Customer *</label>
              <select value={formData.customer_id} onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })} disabled={modalMode === "view"} className="w-full border rounded-lg p-2">
                <option value="">Select Customer</option>
                {customers.map((c: Customer) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Product */}
            <div>
              <label className="block text-sm font-medium mb-2">Product *</label>
              <select value={formData.product_id} onChange={(e) => setFormData({ ...formData, product_id: e.target.value })} disabled={modalMode === "view"} className="w-full border rounded-lg p-2">
                <option value="">Select Product</option>
                {products.map((p: Product) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-sm font-medium mb-2">Unit Price *</label>
              <input type="number" value={formData.unit_price} onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })} disabled={modalMode === "view"} className="w-full border rounded-lg p-2" />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-2">Quantity *</label>
              <input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} disabled={modalMode === "view"} className="w-full border rounded-lg p-2" />
            </div>

            {/* Style Preferences */}
            <div>
              <label className="block text-sm font-medium mb-2">Style Preferences</label>
              <textarea value={formData.style_preferences} onChange={(e) => setFormData({ ...formData, style_preferences: e.target.value })} disabled={modalMode === "view"} className="w-full border rounded-lg p-2" />
            </div>

            {modalMode !== "view" && (
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                {loading ? <><RefreshCw className="w-4 h-4 animate-spin mr-2" /> Saving...</> : modalMode === "create" ? "Create Order" : "Update Order"}
              </Button>
            )}
          </form>
        </SlideModal>

        <MessageModal isOpen={messageModal.isOpen} onClose={closeMessageModal} type={messageModal.type} title={messageModal.title} message={messageModal.message} />
      </main>
    </div>
  );
};

export default SingleOrderManagement;
