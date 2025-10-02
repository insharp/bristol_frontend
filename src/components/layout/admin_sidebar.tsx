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
    //{ icon: <FaHome />, label: "Overview", href: "/admin/overview" },

    { icon: <UserCart width="23px" height="23px"  />, label: "Customers", href: "/admin/customer" },
    { icon: <TbShirt />, label: "Products", href: "/admin/product" },
    { icon: <LuPencilRuler/>, label: "Measurements", href: "/admin/measurement" },
    { icon: <HiOutlineClipboardList />, label: "Orders", href: "/admin/order"},
    { icon: <LuCalendarCheck />, label: "Appointments", href: "/admin/appointment" },
     { icon: <RiExchangeDollarLine />, label: "Cashbook", href: "/admin/cashbook" },
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














