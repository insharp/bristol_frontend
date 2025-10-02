"use client";
import React from "react";
import AppointmentManagement from "@/components/shared/AppointmentManagement";

const AppointmentPage = () => {
  return (
        <AppointmentManagement
          title="Appointment Management"
          permissions={{
            canCreate: true,
            canEdit: true,
            canDelete: true,
            canView: true,

          }}
           
         />
  );
};

export default AppointmentPage;