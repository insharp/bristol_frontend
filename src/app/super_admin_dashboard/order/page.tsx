"use client";

import OrderManagement from "@/components/shared/OrderManagement";
import { useState } from "react";

const OrdersPage = () => {
  // You can customize permissions based on user role or other logic
  const [permissions] = useState({
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canView: true,
  });

  


  return (
    <div className="min-h-screen bg-gray-50">
      <OrderManagement
        title="Order Management"
       
      />
    </div>
  );
};

export default OrdersPage;