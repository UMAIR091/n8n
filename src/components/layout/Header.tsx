"use client";

import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";

interface HeaderUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface HeaderProps {
  title?: string;
  user?: HeaderUser;
}

export function Header({ title, user }: HeaderProps) {
  const currentUser = user;

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div>
        {title && (
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        )}
      </div>
      <div className="flex items-center gap-4">
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.image || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(currentUser.name || currentUser.email || "U")}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:block">
                  {currentUser.name || currentUser.email}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="text-sm font-medium">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentUser.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
