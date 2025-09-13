"use client";

import OrderManagement from "@/components/shared/OrderManagement";
import { useState } from "react";

const OrdersPage = () => {
  // You can customize permissions based on user role or other logic

  return (
    <div className="min-h-screen bg-gray-50">
      <OrderManagement
        viewModalButtons={{
          showEditButton: false,
          showDeleteButton: false
        }}
      />
    </div>
  );
};

export default OrdersPage;