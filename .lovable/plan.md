# Fix slow image loading

## Diagnosis (confirmed)

`shop_items.image` stores **base64 data URLs**. Catalog today: 20 items, **41 MB total**, **~2 MB avg**, biggest 2.5 MB. Every Shop/Inventory mount runs `select("*")` and downloads the whole 41 MB JSON before any card paints. No HTTP caching, no CDN, no lazy loading.

## Plan

### 1. Storage bucket for item images

Migration:
- Create public bucket `shop-item-images`
- RLS on `storage.objects` for that bucket: public SELECT; INSERT/UPDATE/DELETE only when `has_role(auth.uid(), 'admin')`

### 2. One-time backfill (admin-only edge function)

New edge function `backfill-shop-images` (admin-gated, invoked once from a button on `/admin`):
- For each `shop_items` row where `image LIKE 'data:%'`:
  - Decode base64
  - Re-encode to **webp, max 800×800** (preserve aspect, no upscale)
  - Upload to `shop-item-images/{id}.webp`
  - `update shop_items set image = '<public url>'`
- Show progress + result summary in the admin UI

### 3. Admin upload flow → bucket (not base64)

In the admin item editor:
- On image pick: client-side resize to ≤800×800 + convert to webp via canvas
- Upload to `shop-item-images/{id}.webp`
- Save returned public URL into `shop_items.image`
- Drop the FileReader→data URL path

### 4. Split catalog query (helps even mid-backfill)

`src/game/customItems.ts`:
- `refresh()` selects everything **except** `image` first → cards render names/prices/rarity instantly
- Parallel `select("id, image")` merges in as it arrives
- Expose a `loaded` flag

### 5. Lazy load + skeletons

`Shop.tsx`, `Inventory.tsx`, `ClimberAvatar.tsx`:
- All item `<img>` get `loading="lazy"` + `decoding="async"`
- Render 6 rarity-bordered skeleton tiles while `!loaded`
- Keep rarity-bordered placeholder square visible until image decodes (no layout shift)

## Expected result

- Initial JSON payload: **41 MB → ~5 KB**
- Per-image bytes: **~2 MB base64 → ~30–80 KB webp**, served from CDN with cache headers
- Cards visible in <200 ms; images stream in as the user scrolls

## Files

**New**
- Migration: bucket + RLS policies
- `supabase/functions/backfill-shop-images/index.ts`
- Admin button to trigger backfill

**Modified**
- `src/game/customItems.ts` — split query, `loaded` flag, upload to Storage
- `src/pages/Admin.tsx` (item editor) — resize+webp+upload flow, backfill button
- `src/pages/Shop.tsx`, `src/pages/Inventory.tsx`, `src/components/ClimberAvatar.tsx` — lazy `<img>`, skeletons
