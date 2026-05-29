import { useState } from "react";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";

export function AdminNotificationsPanel() {
  const [type, setType] = useState("feature_announcement");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [highlights, setHighlights] = useState("");
  const [actionLabel, setActionLabel] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [priority, setPriority] = useState("normal");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required");
      return;
    }
    setBusy(true);
    const row = {
      user_id: null,
      audience: "all",
      type,
      source: "admin",
      title: title.trim(),
      body: body.trim(),
      highlights: highlights
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      action_label: actionLabel.trim() || null,
      action_url: actionUrl.trim() || null,
      priority,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      payload: {},
    };
    const { error } = await supabase.from("notifications" as any).insert(row);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Notification sent to everyone");
    setTitle("");
    setBody("");
    setHighlights("");
    setActionLabel("");
    setActionUrl("");
    setStartsAt("");
    setExpiresAt("");
  }

  return (
    <GameCard tone="accent" className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Megaphone className="h-5 w-5 text-[hsl(var(--btn-orange))]" />
        <div className="menu-label">Broadcast a Notification</div>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Send a global notification visible to every user. Each user can dismiss it independently.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="feature_announcement">Feature announcement</SelectItem>
              <SelectItem value="shop_update">Shop update</SelectItem>
              <SelectItem value="balance_update">Balance update</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High (auto-pops)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New Feature: Weekly Quest Recaps" />
        </div>
        <div className="sm:col-span-2">
          <Label>Body</Label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Tell climbers what's new…" />
        </div>
        <div className="sm:col-span-2">
          <Label>Highlights (one per line, optional)</Label>
          <Textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={3} placeholder={"5 new gear items\n+10% boss bonus until Sunday"} />
        </div>
        <div>
          <Label>Action label (optional)</Label>
          <Input value={actionLabel} onChange={(e) => setActionLabel(e.target.value)} placeholder="Open Shop" />
        </div>
        <div>
          <Label>Action URL (optional)</Label>
          <Input value={actionUrl} onChange={(e) => setActionUrl(e.target.value)} placeholder="/shop" />
        </div>
        <div>
          <Label>Starts at (optional)</Label>
          <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>
        <div>
          <Label>Expires at (optional)</Label>
          <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
      </div>
      <div className="mt-4">
        <GameButton variant="primary" size="sm" onClick={submit} disabled={busy}>
          {busy ? "Sending…" : "Send to Everyone"}
        </GameButton>
      </div>
    </GameCard>
  );
}
