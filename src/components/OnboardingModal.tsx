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
import { Backpack, Store, ArrowUp, Building2, ScrollText } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

type StepKey = "gender" | "log" | "equip" | "level" | "gym";
const STEP_ORDER: StepKey[] = ["gender", "log", "equip", "level", "gym"];

export function OnboardingModal({ open, onClose }: Props) {
  const [step, setStep] = useState<StepKey>("gender");
  const [picked, setPicked] = useState<Gender | null>(null);
  const nav = useNavigate();

  const stepIdx = STEP_ORDER.indexOf(step);
  const isLast = step === "gym";

  useEffect(() => {
    if (open) {
      setStep("gender");
      setPicked(null);
    }
  }, [open]);

  function next() {
    if (step === "gender") {
      if (!picked) return;
      setGender(picked);
    }
    const nextStep = STEP_ORDER[stepIdx + 1];
    if (nextStep) setStep(nextStep);
  }

  function finish() {
    completeOnboarding();
    onClose();
    nav("/gym");
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
          />
        )}

        {step === "level" && (
          <StepCard
            icon={<ArrowUp className="h-5 w-5" />}
            title="Level up to unlock better gear"
            body={<>
              Spend Chalk to climb the ranks. Each level unlocks rarer items, more gear slots, and tougher bosses.
            </>}
          />
        )}

        {step === "gym" && (
          <StepCard
            icon={<Building2 className="h-5 w-5" />}
            title="Set up your climbing gym"
            body={<>
              Add the gyms you climb at, their grading systems, and hold colors. You'll need at least one gym before you can log a climb.
            </>}
          />
        )}

        <DialogFooter className="mt-2">
          <GameButton
            variant="primary"
            onClick={isLast ? finish : next}
            disabled={step === "gender" && !picked}
            className="w-full sm:w-auto"
          >
            {isLast ? <><Building2 className="h-4 w-4" /> Set up my gym</> : <>Next</>}
          </GameButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StepCard({
  image, altImage, icon, secondaryIcon, title, body,
}: {
  image?: string; altImage?: string;
  icon: React.ReactNode; secondaryIcon?: React.ReactNode;
  title: string; body: React.ReactNode;
}) {
  return (
    <div className="space-y-4 py-2">
      {(image || altImage) && (
        <div className="flex items-center justify-center gap-3">
          {image && <img src={image} alt="" className="h-24 w-24 object-contain rounded-xl" />}
          {altImage && <img src={altImage} alt="" className="h-24 w-24 object-contain rounded-xl" />}
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
    </div>
  );
}
