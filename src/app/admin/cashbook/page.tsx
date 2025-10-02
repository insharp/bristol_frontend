"use client";
import CashBookManagement from "@/components/shared/CashbookManagement";
import React from "react";


const AdminCashBookPage = () => {
  return (
    <CashBookManagement
      title="Admin - Cash Book Management"
      permissions={{
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canView: true,
        canViewSummary: true
      }}
    />
  );
};

export default AdminCashBookPage;