// components/layouts/SidebarLayout.tsx
'use client';
import Sidebar, { SidebarItem } from "@/components/ui/sidebar";
import { UserCart } from "iconoir-react";
import { useRouter } from "next/navigation";
import React from "react";
import { FiLogOut } from "react-icons/fi";
import { HiOutlineClipboardList } from "react-icons/hi";
import { LuCalendarCheck, LuPencilRuler } from "react-icons/lu";
import { RiExchangeDollarLine } from "react-icons/ri";
import { TbShirt } from "react-icons/tb";


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
    //{ icon: <FaHome />, label: "Overview", href: "/admin_dashboard/overview" },

    { icon: <UserCart width="23px" height="23px"  />, label: "Customers", href: "/admin_dashboard/customer" },
    { icon: <TbShirt />, label: "Products", href: "/admin_dashboard/product" },
    { icon: <LuPencilRuler/>, label: "Measurements", href: "/admin_dashboard/measurement" },
    { icon: <HiOutlineClipboardList />, label: "Orders", href: "/admin_dashboard/order"},
    { icon: <LuCalendarCheck />, label: "Appointments", href: "/admin_dashboard/appointment" },
     { icon: <RiExchangeDollarLine />, label: "Cashbook", href: "/admin_dashboard/cashbook" },
    { icon: <FiLogOut width="20px" height="20px" />, label: "Logout", onClick: handleLogout },
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














