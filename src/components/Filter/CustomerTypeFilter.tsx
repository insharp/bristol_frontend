//components/shared/CustomerManagement/CustomerTypeFilter.tsx
"use client";
import React from "react";
import { CustomerType } from "@/app/hooks/useCustomers";

interface CustomerTypeFilterProps {
  selectedType: CustomerType;
  onTypeChange: (type: CustomerType) => void;
  getCustomerCount: (type: CustomerType) => number;
}

const CustomerTypeFilter: React.FC<CustomerTypeFilterProps> = ({
  selectedType,
  onTypeChange,
  getCustomerCount
}) => {
  const typeFilters = [
 
    { key: "individual" as CustomerType, label: "Individual", count: getCustomerCount("individual") },
    { key: "corporate" as CustomerType, label: "Corporate", count: getCustomerCount("corporate") },
  ];

  return (
    <div className="flex  p-1 ">
  {typeFilters.map((filter) => (
    <button
      key={filter.key}
      onClick={() => onTypeChange(filter.key)}
      className={`px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 ${
        selectedType === filter.key
          ? "border-blue-500 text-black"
          : "border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50 "
      }`}
    >
      {filter.label}
    </button>
  ))}
</div>

  );
};

export default CustomerTypeFilter;