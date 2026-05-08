import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { isNameAvailable } from "@/game/characterName";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onValidityChange?: (valid: boolean) => void;
  /** If editing, the user's current name is allowed */
  currentName?: string | null;
  placeholder?: string;
  autoFocus?: boolean;
}

export function CharacterNameInput({ value, onChange, onValidityChange, currentName, placeholder, autoFocus }: Props) {
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">("idle");
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === "" ) { setStatus("idle"); onValidityChange?.(false); return; }
    if (currentName && trimmed.toLowerCase() === currentName.toLowerCase()) {
      setStatus("ok"); onValidityChange?.(true); return;
    }
    if (trimmed.length < 2 || trimmed.length > 24) { setStatus("invalid"); onValidityChange?.(false); return; }
    if (!/^[A-Za-z0-9 _\-]+$/.test(trimmed)) { setStatus("invalid"); onValidityChange?.(false); return; }
    setStatus("checking");
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const ok = await isNameAvailable(trimmed);
      if (value.trim() !== trimmed) return;
      setStatus(ok ? "ok" : "taken");
      onValidityChange?.(ok);
    }, 350);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, currentName]);

  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? "Your climber's name"}
          autoFocus={autoFocus}
          maxLength={24}
          className="pr-9"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {status === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {status === "ok" && <Check className="h-4 w-4 text-[hsl(var(--success,142_70%_45%))]" />}
          {(status === "taken" || status === "invalid") && <X className="h-4 w-4 text-destructive" />}
        </div>
      </div>
      <div className={cn(
        "text-xs",
        status === "ok" ? "text-[hsl(var(--success,142_70%_45%))]" :
        status === "taken" || status === "invalid" ? "text-destructive" :
        "text-muted-foreground"
      )}>
        {status === "ok" && "Available"}
        {status === "taken" && "That name is taken"}
        {status === "invalid" && "2–24 characters · letters, numbers, spaces, _ and -"}
        {status === "checking" && "Checking availability…"}
        {status === "idle" && "2–24 characters · letters, numbers, spaces, _ and -"}
      </div>
    </div>
  );
}
