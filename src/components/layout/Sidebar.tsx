"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  AlertCircle,
  Users,
  BarChart3,
  Bell,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/failures",
    label: "Payment Failures",
    icon: AlertCircle,
  },
  {
    href: "/dashboard/customers",
    label: "Customers",
    icon: Users,
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    href: "/dashboard/notifications",
    label: "Notifications",
    icon: Bell,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold">Recoverly</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Free Plan
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Upgrade for unlimited failures
          </p>
          <Link
            href="/dashboard/settings"
            className="mt-2 block text-xs font-medium text-primary hover:underline"
          >
            Upgrade plan →
          </Link>
        </div>
      </div>
    </div>
  );
}
