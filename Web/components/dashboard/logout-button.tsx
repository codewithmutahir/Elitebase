"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="mt-2 h-auto justify-start gap-2 px-0 text-slate-600 hover:text-blue-600"
      onClick={() =>
        authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              window.location.href = "/login";
            },
          },
        })
      }
    >
      <LogOut className="size-4" aria-hidden />
      Log out
    </Button>
  );
}
