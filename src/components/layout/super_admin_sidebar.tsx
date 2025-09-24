// components/layouts/SidebarLayout.tsx
'use client';
import Sidebar, { SidebarItem } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import React from "react";
import { HiOutlineClipboardList } from "react-icons/hi";
import { LuCalendarCheck, LuPencilRuler } from "react-icons/lu";
import { TbShirt, TbUsers } from "react-icons/tb";
import {  UserCart} from "iconoir-react";
import { FiLogOut } from "react-icons/fi";

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
    { icon: <UserCart width="23px" height="23px" />, label: "Customers", href: "/super_admin_dashboard/customer" },
    { icon:<TbShirt />, label: "Products", href: "/super_admin_dashboard/product" },
    { icon: <LuPencilRuler />, label: "Measurements", href: "/super_admin_dashboard/measurement" },
    { icon: <HiOutlineClipboardList />, label: "Orders", href: "/super_admin_dashboard/order" },
    { icon: <LuCalendarCheck />, label: "Appointments", href: "/super_admin_dashboard/appointment" },
    //{ icon: <FaHome />, label: "Overview", href: "/super_admin_dashboard/overview" },
    { icon: <TbUsers />, label: "User", href: "/super_admin_dashboard/users" },
    { icon: <FiLogOut width="20px" height="20px"  />, label: "Logout", onClick: handleLogout },
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














