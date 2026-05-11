import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GameButton } from "@/components/ui/game-button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const FEEDBACK_CATEGORIES = [
  "Bouldering & Logging",
  "Strength Training",
  "Shop & Items",
  "Levels & Progression",
  "Gym Setup",
  "Leaderboard",
  "UI / Visual",
  "Bug Report",
  "Feature Request",
  "Other",
] as const;

export function FeedbackButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  async function submit() {
    if (!user) return;
    const trimmed = message.trim();
    if (!category) { toast.error("Pick a category"); return; }
    if (trimmed.length < 3) { toast.error("Please write a bit more"); return; }
    if (trimmed.length > 2000) { toast.error("Please keep it under 2000 characters"); return; }
    setBusy(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      category,
      message: trimmed,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Thanks for the feedback!");
    setMessage(""); setCategory(""); setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        title="Send feedback"
        className={cn(
          "fixed z-30 right-4 bottom-20 md:bottom-4 h-11 w-11 rounded-full border-2 border-[hsl(var(--panel-frame))]",
          "bg-secondary/90 backdrop-blur text-foreground/90 hover:text-foreground hover:bg-secondary",
          "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.08),inset_0_-1px_0_hsl(0_0%_0%/0.5),0_4px_12px_-4px_hsl(0_0%_0%/0.6)]",
          "transition-all hover:brightness-110 active:translate-y-[1px] flex items-center justify-center",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
        )}
      >
        <MessageSquare className="h-4.5 w-4.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Send feedback
            </DialogTitle>
            <DialogDescription>
              Tell us what's working, what's broken, or what you'd love to see next.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pick a category" />
                </SelectTrigger>
                <SelectContent>
                  {FEEDBACK_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Your feedback</Label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                rows={5}
                maxLength={2000}
                className="mt-1"
              />
              <div className="text-[11px] text-muted-foreground mt-1 text-right tabular-nums">
                {message.length}/2000
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <GameButton variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={busy}>Cancel</GameButton>
            <GameButton variant="primary" size="sm" onClick={submit} disabled={busy}>
              {busy ? "Sending…" : "Send feedback"}
            </GameButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
