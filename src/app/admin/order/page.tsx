"use client";

import OrderManagement from "@/components/shared/OrderManagement";
import { useState } from "react";

const OrdersPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <OrderManagement
        permissions={{
          canCreate: true,
          canView: true,
          canEdit: false,
          canDelete: false
        }}
        viewModalButtons={{
          showEditButton: false,
          showDeleteButton: false
        }}
      />
    </div>
  );
};

export default OrdersPage;