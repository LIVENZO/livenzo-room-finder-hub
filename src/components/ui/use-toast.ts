
// Re-export the toast hooks from the main hooks directory
import * as React from "react";
import { toast } from "sonner";

export { toast };

export function useToast() {
  return {
    toast
  };
}
