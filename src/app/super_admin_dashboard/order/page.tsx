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
          canEdit: true,
          canDelete: true
        }}
        viewModalButtons={{
          showEditButton: true,
          showDeleteButton: true
        }}
      />
    </div>
  );
};

export default OrdersPage;