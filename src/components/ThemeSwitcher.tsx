import { useState } from "react";
import { Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ThemeStudio } from "@/components/ThemeStudio";

export function ThemeButton() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          aria-label="Theme studio"
          className="h-9 w-9 grid place-items-center rounded-full border-2 border-[hsl(var(--panel-frame))] bg-secondary text-foreground hover:brightness-110 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.08),inset_0_-1px_0_hsl(0_0%_0%/0.5)]"
        >
          <Settings className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Theme Studio</DialogTitle>
        </DialogHeader>
        <ThemeStudio compact />
      </DialogContent>
    </Dialog>
  );
}
