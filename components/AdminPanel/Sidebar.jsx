// components/AdminPanel/Sidebar.jsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiBook,
  FiUsers,
  FiClipboard,
  FiFileText,
  FiBarChart,
  FiImage,
} from "react-icons/fi";

export default function Sidebar({ open, setOpen }) {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/admin", icon: <FiHome /> },
    { name: "Blogs", href: "/admin/blogs", icon: <FiBook /> },
    { name: "Gallery", href: "/admin/gallery", icon: <FiImage /> },
    { name: "Students", href: "/admin/students", icon: <FiUsers /> },
    { name: "Instructors", href: "/admin/instructors", icon: <FiClipboard /> },
    { name: "Questions", href: "/admin/questions", icon: <FiFileText /> },
    { name: "Exams", href: "/admin/exams", icon: <FiBarChart /> },
    { name: "Results", href: "/admin/results", icon: <FiBarChart /> },
  ];

  return (
    <div
      className={`fixed lg:static z-50 h-full bg-white shadow-lg w-64 transform transition-transform duration-300
      ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
    >
      <div className="p-4 font-bold text-lg border-b">Admin</div>
      <nav className="flex flex-col p-2">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 ${
                active ? "bg-gray-200 font-semibold" : ""
              }`}
              onClick={() => setOpen(false)}
            >
              {link.icon} {link.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
