"use client";
import React from "react";
import ProductManagement from "@/components/shared/ProductManagement";

const AdminProductsPage = () => {
  return (
    <ProductManagement
      title="Admin - Product Management"
      permissions={{
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canView: true
      }}
    />
  );
};

export default AdminProductsPage;
