"use client";
import React, { useState } from "react";
import ProductManagement from "@/components/shared/ProductManagement";
import MeasurementFieldManagement from "@/components/shared/MeasurementFieldManagement";
import Button from "@/components/ui/button";
import ProductMeasurementComponent from "@/components/shared/ProductMeasurement";
import CustomerMeasurement from "@/components/shared/CustomerMeasurement";

type TabType = 'customer' | 'product' | 'fields';

const AdminMeasurementPage = () => {
  const [activeTab, setActiveTab] = useState('customer'); // Default to customer tab

  const handleTabClick = (tabName:TabType) => {
    setActiveTab(tabName);
  };

  const getButtonStyle = (tabName:TabType) => {
    return activeTab === tabName 
      ? "bg-blue-500 text-white px-4 py-2 rounded" // Active button style
      : "bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"; // Inactive button style
  };

  return (
    <div>
      {/* Tab Buttons */}
      <div className="flex space-x-4 mb-4 ml-1">
        <button 
          className={getButtonStyle('customer')}
          onClick={() => handleTabClick('customer')}
        >
          Customer Measurements
        </button>
        
        <button 
          className={getButtonStyle('product')}
          onClick={() => handleTabClick('product')}
        >
          Product Measurements
        </button>
        
        <button 
          className={getButtonStyle('fields')}
          onClick={() => handleTabClick('fields')}
        >
          Measurement Fields
        </button>
      </div>

      {/* Conditional Rendering of Tables */}
      {activeTab === 'customer' && (
        <CustomerMeasurement 
      view={true}
      edit={false}
      delete={false}
      add={true}
    />
      )}

      {activeTab === 'product' && (
        <ProductMeasurementComponent
        permissions={{
                canCreate: true,
                canEdit: false,
                canDelete: false,
                canView: true
            }}
           
        />
      )}


      {activeTab === 'fields' && (
       <MeasurementFieldManagement 
            title="Measurement Fields"
            permissions={{
                canCreate: true,
                canEdit: false,
                canDelete: false,
                canView: true
            }}
         
            />
      )}
    </div>
  );
};



export default AdminMeasurementPage;