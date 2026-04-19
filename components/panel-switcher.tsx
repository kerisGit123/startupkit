"use client";

import { Film, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

export function PanelSwitcher() {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">Admin Panel</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Switch Panel</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/storyboard-studio")} className="gap-2">
          <Film className="h-4 w-4" />
          <span>Storyboard Studio</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/admin")} className="gap-2">
          <Shield className="h-4 w-4" />
          <span>Admin Panel</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
