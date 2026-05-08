import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { GameButton } from "@/components/ui/game-button";
import { ClimberAvatar } from "@/components/ClimberAvatar";
import { setGender, completeOnboarding } from "@/game/store";
import { Gender, RARITY_BORDER } from "@/game/data";
import { useAllItems, isImageEmoji } from "@/game/customItems";
import { SmartImage } from "@/components/SmartImage";
import { cn } from "@/lib/utils";
import chalkBagImg from "@/assets/chalk-bag.png";
import boulderImg from "@/assets/log-boulder.webp";
import bossImg from "@/assets/log-boss.webp";
import { Backpack, Store, ArrowUp, Building2, ScrollText, Sparkles } from "lucide-react";
import { CharacterNameInput } from "@/components/CharacterNameInput";
import { setCharacterName, useCharacterName } from "@/game/characterName";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

type StepKey = "gender" | "name" | "log" | "equip" | "level" | "gym";
const STEP_ORDER: StepKey[] = ["gender", "name", "log", "equip", "level", "gym"];

export function OnboardingModal({ open, onClose }: Props) {
  const [step, setStep] = useState<StepKey>("gender");
  const [picked, setPicked] = useState<Gender | null>(null);
  const existingName = useCharacterName();
  const [name, setName] = useState("");
  const [nameValid, setNameValid] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const nav = useNavigate();

  const stepIdx = STEP_ORDER.indexOf(step);
  const isLast = step === "gym";

  useEffect(() => {
    if (open) {
      setStep("gender");
      setPicked(null);
      setName(existingName ?? "");
    }
  }, [open, existingName]);

  async function next() {
    if (step === "gender") {
      if (!picked) return;
      setGender(picked);
    }
    if (step === "name") {
      if (!nameValid) return;
      // If unchanged from existing, skip the call
      if (!existingName || existingName.trim().toLowerCase() !== name.trim().toLowerCase()) {
        setSavingName(true);
        const r = await setCharacterName(name);
        setSavingName(false);
        if (!r.ok) { toast.error(r.error); return; }
      }
    }
    const nextStep = STEP_ORDER[stepIdx + 1];
    if (nextStep) setStep(nextStep);
  }

  function finish() {
    completeOnboarding();
    onClose();
    nav("/");
  }

  return (
    <Dialog open={open} onOpenChange={() => { /* not dismissable */ }}>
      <DialogContent
        className="max-w-xl [&>button.absolute]:hidden"
        onInteractOutside={e => e.preventDefault()}
        onEscapeKeyDown={e => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-lg">Welcome to ClimbQuest</DialogTitle>
            <div className="flex gap-1.5">
              {STEP_ORDER.map((k, i) => (
                <span key={k} className={cn(
                  "h-1.5 w-6 rounded-full transition-colors",
                  i <= stepIdx ? "bg-[hsl(var(--btn-orange))]" : "bg-secondary"
                )} />
              ))}
            </div>
          </div>
          <DialogDescription className="sr-only">First-time onboarding</DialogDescription>
        </DialogHeader>

        {step === "gender" && (
          <div className="space-y-4 py-2">
            <div className="text-sm text-muted-foreground">
              Pick your climber. <span className="text-destructive font-semibold">This can't be changed later.</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(["male", "female"] as Gender[]).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setPicked(g)}
                  className={cn(
                    "rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition",
                    picked === g
                      ? "border-[hsl(var(--btn-orange))] bg-[hsl(var(--btn-orange))]/10"
                      : "border-border hover:border-[hsl(var(--panel-frame))]"
                  )}
                >
                  <ClimberAvatar level={1} gender={g} equipped={{}} size="lg" />
                  <div className="text-sm font-semibold capitalize">{g}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "log" && (
          <StepCard
            image={boulderImg}
            altImage={bossImg}
            largeImages
            icon={<ScrollText className="h-5 w-5" />}
            title="Log climbs to earn Chalk"
            body={<>
              Every boulder you log earns <span className="inline-flex items-center gap-1 font-semibold"><img src={chalkBagImg} alt="" className="h-4 w-4" /> Chalk</span>.
              Chalk is the currency you spend to level up and buy gear.
            </>}
          />
        )}

        {step === "equip" && (
          <StepCard
            icon={<Backpack className="h-5 w-5" />}
            secondaryIcon={<Store className="h-5 w-5" />}
            title="Equip gear for bonus Chalk"
            body={<>
              Buy items in the <span className="font-semibold">Shop</span> with Chalk and equip them in your <span className="font-semibold">Inventory</span>.
              Equipped items boost the Chalk you earn from each climb.
            </>}
          >
            <ExampleItems />
          </StepCard>
        )}

        {step === "level" && (
          <StepCard
            icon={<ArrowUp className="h-5 w-5" />}
            title="Level up to unlock better gear"
            body={<>
              Spend Chalk to climb the ranks. Each level unlocks rarer items, more gear slots, and tougher bosses.
            </>}
          >
            <LevelExamples gender={picked ?? "male"} />
          </StepCard>
        )}

        {step === "gym" && (
          <StepCard
            icon={<Building2 className="h-5 w-5" />}
            title="Set up your climbing gym"
            body={<>
              Add the gyms you climb at, their grading systems, and hold colors. You can do this any time from My Gym.
            </>}
          />
        )}

        <DialogFooter className="mt-2 sm:justify-between gap-2">
          <GameButton
            variant="secondary"
            onClick={() => setStep(STEP_ORDER[stepIdx - 1])}
            disabled={stepIdx === 0}
            className="w-full sm:w-auto"
          >
            Back
          </GameButton>
          <GameButton
            variant="primary"
            onClick={isLast ? finish : next}
            disabled={step === "gender" && !picked}
            className="w-full sm:w-auto"
          >
            {isLast ? <><Sparkles className="h-4 w-4" /> Start climbing</> : <>Next</>}
          </GameButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StepCard({
  image, altImage, largeImages, icon, secondaryIcon, title, body, children,
}: {
  image?: string; altImage?: string; largeImages?: boolean;
  icon: React.ReactNode; secondaryIcon?: React.ReactNode;
  title: string; body: React.ReactNode; children?: React.ReactNode;
}) {
  const imgSize = largeImages ? "h-40 w-40 sm:h-48 sm:w-48" : "h-24 w-24";
  return (
    <div className="space-y-4 py-2">
      {(image || altImage) && (
        <div className="flex items-center justify-center gap-4">
          {image && <img src={image} alt="" className={cn(imgSize, "object-contain rounded-xl")} />}
          {altImage && <img src={altImage} alt="" className={cn(imgSize, "object-contain rounded-xl")} />}
        </div>
      )}
      <div className="flex items-center gap-2 text-base font-semibold">
        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[hsl(var(--btn-orange))]/15 text-[hsl(var(--btn-orange))]">{icon}</span>
        {secondaryIcon && (
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-foreground/80">{secondaryIcon}</span>
        )}
        <span>{title}</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
      {children}
    </div>
  );
}

function ExampleItems() {
  const items = useAllItems();
  const picks = [
    items.find(i => i.rarity === "legendary"),
    items.find(i => i.rarity === "rare"),
    items.find(i => i.rarity === "common"),
  ].filter(Boolean).slice(0, 3) as ReturnType<typeof useAllItems>;
  if (picks.length === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-2">
      {picks.map(item => (
        <div key={item.id} className={cn("rounded-lg p-2 bg-background/40 flex flex-col items-center gap-1.5", RARITY_BORDER[item.rarity])}>
          {isImageEmoji(item.emoji) ? (
            <SmartImage src={item.emoji!} alt={item.name} loaderSize={28} wrapperClassName="h-16 w-16" className="h-full w-full object-contain" />
          ) : (
            <div className="text-3xl h-16 w-16 flex items-center justify-center">{item.emoji ?? "🎒"}</div>
          )}
          <div className="text-[10px] text-center font-medium leading-tight line-clamp-2">{item.name}</div>
          {item.bonus?.mult ? (
            <div className="text-[10px] font-bold text-chalk-glow tabular-nums">+{Math.round(item.bonus.mult * 100)}%</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function LevelExamples({ gender }: { gender: Gender }) {
  const levels = [3, 6, 10];
  return (
    <div className="grid grid-cols-3 gap-3">
      {levels.map(lvl => (
        <div key={lvl} className="flex flex-col items-center gap-1.5 rounded-lg p-2 bg-background/40 border border-border">
          <ClimberAvatar level={lvl} gender={gender} equipped={{}} size="lg" />
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Level {lvl}</div>
        </div>
      ))}
    </div>
  );
}
