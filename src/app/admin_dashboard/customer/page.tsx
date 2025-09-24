"use client";
import React from "react";
import CustomerManagement from "@/components/shared/CustomerManagement";

const AdminCustomersPage = () => {
  return (
    <CustomerManagement
      title="Customer Management"
      permissions={{
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canView: true
      }}
    />
  );
};


export default AdminCustomersPage;