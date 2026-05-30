"use client";

import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Plus, Building2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export function WorkspaceSwitcher() {
  const { data: session } = useSession();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);

  useEffect(() => {
    async function fetchOrgs() {
      try {
        const res = await fetch("/api/organizations");
        if (res.ok) {
          const data = await res.json();
          setOrganizations(data.data || []);
          if (data.data?.length > 0 && session?.user?.organizationId) {
            const org = data.data.find(
              (o: Organization) => o.id === session.user.organizationId
            );
            setCurrentOrg(org || data.data[0]);
          }
        }
      } catch {
        // Ignore
      }
    }
    fetchOrgs();
  }, [session?.user?.organizationId]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-2 text-left"
          size="sm"
        >
          <Building2 className="h-4 w-4" />
          <span className="hidden max-w-[120px] truncate md:block">
            {currentOrg?.name || "Select workspace"}
          </span>
          <ChevronsUpDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            className={
              org.id === currentOrg?.id ? "bg-accent" : "cursor-pointer"
            }
            onClick={() => setCurrentOrg(org)}
          >
            <Building2 className="mr-2 h-4 w-4" />
            <span className="truncate">{org.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Create workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
