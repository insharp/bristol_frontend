'use client';
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface SidebarProps {
  items: SidebarItem[];
  userName: string;
  userAvatarUrl?: string;
  logoUrl?: string;
  logoText?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,    
}) => {
  const pathname = usePathname();
  
  return (
    <aside
      className="flex flex-col  w-64 bg-white border-r border-gray-200 py-4" style={{ minHeight: '100vh' }}
    >
      <div className="flex-1">
        {/* Navigation Items */}
        <nav className="flex flex-col px-4 gap-2">
          {items.map((item) => {
            const isActive = item.href && pathname.startsWith(item.href);
            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span> {/* Uncommented this line */}
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            } else {                           
              return (
                <div
                  key={item.label}
                  onClick={item.onClick}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors hover:bg-gray-100 text-gray-700 cursor-pointer"
                >
                  <span className="text-lg">{item.icon}</span> {/* Uncommented this line */}
                  <span className="text-sm">{item.label}</span>
                </div>
              );
            }
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;