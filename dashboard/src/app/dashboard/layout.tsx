"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<{ firstName: string; lastName: string; role: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      router.push("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (!user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Top Navigation */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-950 shadow-sm">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="text-xl font-bold">
            Care-Queue
          </Link>
          {user.role === "SUPER_ADMIN" && (
             <Link href="/dashboard/organizations" className="text-sm text-gray-500 hover:text-black">
               Organizations
             </Link>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">
            {user.firstName} {user.lastName} ({user.role})
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-6">
        {children}
      </main>
    </div>
  );
}
