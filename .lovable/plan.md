## Fix mobile header overflow

Two coordinated changes so the chalk balance never overflows and the logo only shrinks when it actually has to.

### 1. Compact ChalkChip on mobile
- Hide the "Chalk" caption below the `sm` breakpoint. The icon + number stay; this saves ~36px.
- Tighten right padding on mobile (`pr-3` instead of `pr-4`) since the label is gone.

### 2. Logo: stay big when there's room, shrink only when needed
The current setup uses fixed `h-10 sm:h-20` and `shrink-0` on the image, so on phones the logo is always small even when there's free space. New behavior:

- Wrap the logo in a `flex-1 min-w-0` container so the right-side controls reserve their natural width first.
- Set the image to `h-auto w-full max-h-20 max-w-[180px] object-contain object-left`. The image grows up to its natural cap (h-20, ~180px wide) when there's space, and scales down proportionally — never squeezed, never cropped — when the right side needs the space.
- Keep `drop-shadow` and hover rotation.

This means: at 390px with a 50k chalk balance, the logo settles around h-10–h-12 automatically; at 480px+ phones it reaches its full h-20; on desktop unchanged.

### Files
- `src/components/Layout.tsx` — update the `<NavLink to="/home">` block (logo) and the `<ChalkChip>` button markup/classes.

### Out of scope
- No change to nav, sign-out, or Lv chip.
- No change to the chalk number formatting (still uses the existing `formatChalk` thresholds).
