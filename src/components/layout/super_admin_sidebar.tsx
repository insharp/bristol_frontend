// components/layouts/SidebarLayout.tsx
'use client';
import Sidebar, { SidebarItem } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import React from "react";
import { FaHome, FaUpload, FaFolderOpen, FaUser, FaCog, FaQuestionCircle, FaSignOutAlt, FaIdBadge } from "react-icons/fa";

export default function SidebarLayout() {
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      await fetch(`http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}/user/logout`, {
        method: "POST",
        credentials: "include",
      });
      router.replace("/auth/login");
    } catch (err) {
      router.replace("/auth/login");
    }
  };


    const sidebarItems: SidebarItem[] = [
    { icon: <FaUser />, label: "Customers", href: "/super_admin_dashboard/customer" },
    { icon: <FaIdBadge />, label: "Measurements", href: "/super_admin_dashboard/measurement" },
    { icon: <FaUpload />, label: "Orders", href: "/super_admin_dashboard/order" },
    { icon: <FaUpload />, label: "Appointments", href: "/super_admin_dashboard/appointment" },
    { icon: <FaUpload />, label: "Products", href: "/super_admin_dashboard/product" },
    //{ icon: <FaHome />, label: "Overview", href: "/super_admin_dashboard/overview" },
    { icon: <FaIdBadge />, label: "User", href: "/super_admin_dashboard/users" },
    { icon: <FaSignOutAlt />, label: "Logout", onClick: handleLogout },
  ];



  return (
    <div >
      <Sidebar
        items={sidebarItems}
        userName="ByeWind"
        userAvatarUrl="/user.svg"
        logoUrl="/images/m3_description_logo.png"
      />
    </div>
  );
}














