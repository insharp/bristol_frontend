"use client";
import React from "react";
import CustomerManagement from "@/components/shared/CustomerManagement";

const SuperAdminCustomersPage = () => {
  // Super admin might have additional actions like audit logs, bulk operations, etc.
 

  return (
    <CustomerManagement
      title="Customer Management"
      permissions={{
        canCreate: true,
        canEdit: true,
        canDelete: true,  // Super admin can delete
        canView: true
      }}
      
    />
  );
};

export default SuperAdminCustomersPage;