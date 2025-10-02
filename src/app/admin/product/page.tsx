"use client";
import React from "react";
import ProductManagement from "@/components/shared/ProductManagement";

const AdminProductsPage = () => {
  return (
    <ProductManagement
      title="Product Management"
      permissions={{
        canCreate: true,
        canEdit: false,
        canDelete: false,
        canView: true
      }}
    />
  );
};

export default AdminProductsPage;
