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
    { icon: <FaHome />, label: "Overview", href: "/admin_dashboard/overview" },

    { icon: <FaUser />, label: "Customers", href: "/admin_dashboard/customer" },
    { icon: <FaIdBadge />, label: "Measurements", href: "#" },
        { icon: <FaUpload />, label: "Orders", href: "/admin_dashboard/resources"},
    { icon: <FaFolderOpen />, label: "Appointments", href: "#" },
    { icon: <FaQuestionCircle />, label: "Products", href: "/admin_dashboard/product" },
    { icon: <FaSignOutAlt />, label: "Logout", onClick: handleLogout },
  ];


  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={sidebarItems}
        userName="ByeWind"
        userAvatarUrl="/user.svg"
        logoUrl="/images/m3_description_logo.png"
      />
    </div>
  );
}














