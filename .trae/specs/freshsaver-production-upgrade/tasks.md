# FreshSaver Production-Grade Upgrade — Tasks

Maps every Acceptance Criterion from `spec.md` to atomic, dependency-ordered implementation tasks.

## Task 1: Database migration — invites, role, updated_at, indexes

**Priority:** high
**Depends on:** —
**ACs covered:** AC4.1, AC4.2
**Files:** `supabase/migrations/*_freshsaver_invites_realtime.sql`

- Add `role` column to `profiles` (owner/member, default 'member') with a CHECK constraint.
- Create `household_invites` table: `id`, `household_id`, `token` (unique), `role`, `email`, `expires_at`, `consumed_at`, `revoked_at`, `created_by`, `created_at`.
- RLS on `household_invites`: only household owner can create/revoke; only the invitee (by email) can read pending invites.
- Add `updated_at timestamptz DEFAULT now()` to `food_items` and `grocery_list` + `on update now()` trigger for conflict resolution.
- Indexes on `household_invites(household_id)`, `(token)`, `(expires_at)`.

**Task-local Test Requirements:**
- TR4.1a (rule): migration is idempotent and applies cleanly (syntax valid, no duplicate objects).
- TR4.1b (rule): `household_invites` RLS denies a non-owner from inserting/revoking.

---

## Task 2: Supabase Edge Functions — invites + receipt parse stub

**Priority:** high
**Depends on:** Task 1
**ACs covered:** AC4.1, AC4.2, AC1.3, AC1.4
**Files:**
- `supabase/functions/generate-invite/index.ts`
- `supabase/functions/accept-invite/index.ts`
- `supabase/functions/revoke-invite/index.ts`
- `supabase/functions/parse-receipt/index.ts`

- `generate-invite`: owner-only; creates signed 7-day token (HMAC SHA-256 over `household_id.role.email.expires` with a server secret), inserts row.
- `accept-invite`: verifies signature + expiry + not consumed/revoked; sets `consumed_at`; assigns profile to household with role.
- `revoke-invite`: owner sets `revoked_at`.
- `parse-receipt`: validates output against `receiptParseSchema`; returns structured items or a tagged error (`network`/`parse`/`empty`).

**Task-local Test Requirements:**
- TR4.2a (rule): `generate-invite` rejects requests from non-owners.
- TR1.4a (rule): `parse-receipt` response shape satisfies `receiptParseSchema`.

---

## Task 3: Core logic libs — pantry score, recipe prioritization, grocery gap

**Priority:** high
**Depends on:** —
**ACs covered:** AC2.1, AC2.2, AC3.1, AC3.2, AC3.3
**Files:**
- `src/lib/pantryScore.ts` — `calculatePantryScore(items, streak)` returning `{ score, breakdown }`.
- `src/lib/recipePrioritizer.ts` — `prioritizeRecipes(recipes, items)` with 10×/5×/1× weighting + skip penalty.
- `src/lib/groceryGap.ts` — `findMissingIngredients(recipe, items)` returning list of grocery inserts.

- `calculatePantryScore`: activeUtilization (35), shelfLifeCompliance (30), notNearExpiry (25), zeroWasteStreak capped at 10 (10).
- `prioritizeRecipes`: weight map by days-left; rank = sum(matched weights) − penalty(skipped critical × 5); ensure ≥90% of top recipes include a critical item.
- `findMissingIngredients`: fuzzy name match; if inventory quantity < needed, add deficit.

**Task-local Test Requirements:**
- TR2.1a (rule): `calculatePantryScore` returns 100 for all-fresh, 0 for all-expired, handles empty (returns 0 with zero breakdown).
- TR3.1a (rule): a ≤48h item contributes 10× its base; a 3–5d item contributes 5×.
- TR3.2a (rule): when critical items exist, ≥90% of the returned ranked recipes include at least one critical item.
- TR3.3a (rule): `findMissingIngredients` returns only ingredients absent or insufficient in inventory.

---

## Task 4: Vitest setup + unit tests for core logic

**Priority:** high
**Depends on:** Task 3
**ACs covered:** AC2.1, AC3.1, AC3.2, AC3.3, AC1.3
**Files:**
- `vitest.config.ts`, `package.json` scripts (`test`, `test:run`)
- `src/lib/__tests__/pantryScore.test.ts`
- `src/lib/__tests__/recipePrioritizer.test.ts`
- `src/lib/__tests__/groceryGap.test.ts`
- `src/lib/__tests__/receiptSchema.test.ts`

- Install `vitest` (and `@vitest/coverage-v8` optional).
- Write tests covering empty, all-expired, all-fresh, mixed; recipe weighting; gap detection.

**Task-local Test Requirements:**
- TR2.1b (rule): `vitest run` passes with all core-logic suites green.

---

## Task 5: Receipt OCR hardening (Zod schema + retry + error states)

**Priority:** medium
**Depends on:** Task 2
**ACs covered:** AC1.3, AC1.4
**Files:** `src/services/receipt.ts`, `src/validation.ts`, `src/components/ScanView.tsx`

- Add `receiptParseSchema = z.object({ items: z.array(z.object({ name, categoryName, shelfLifeDays })) })`.
- `parseReceipt()`: 3 retries with exponential backoff on network/5xx; validate with schema; on invalid return tagged error → UI shows "Retry" or "Enter manually".
- `ScanView` renders explicit error states and a manual-entry fallback.

**Task-local Test Requirements:**
- TR1.3a (rule): invalid OCR payload fails schema parse and surfaces a manual-entry prompt.
- TR1.4b (rule): retry helper attempts up to 3 times before giving up.

---

## Task 6: Barcode scanner integration

**Priority:** medium
**Depends on:** —
**ACs covered:** AC1.1, AC1.2
**Files:**
- `src/components/BarcodeScanner.tsx`
- `src/services/openFoodFacts.ts`
- `src/components/AddItemModal.tsx` (add "Scan Barcode" entry)

- `BarcodeScanner`: try `window.BarcodeDetector`; else `@zxing/browser` `BrowserMultiFormatReader`. Permission denial → message + fallback to manual. Detected code → `lookupProduct(barcode)` from Open Food Facts (`https://world.openfoodfacts.org/api/v2/product/{barcode}.json`) → prefill form.
- Install `@zxing/browser` and `@zxing/library`.

**Task-local Test Requirements:**
- TR1.1a (rule): scanner exposes permission/error states and emits a barcode string on success.
- TR1.2a (rule): `lookupProduct` maps OFF fields to `{ name, quantity, categoryName }`.

---

## Task 7: Pantry Health Score widget + urgency color/accessibility

**Priority:** high
**Depends on:** Task 3
**ACs covered:** AC2.1, AC2.2, AC2.3
**Files:**
- `src/components/PantryHealthScore.tsx`
- `src/utils.ts` (exact WCAG color map `#22c55e`/`#eab308`/`#ef4444`)
- `src/components/InventoryView.tsx` (use exact colors + `aria-label`)
- `src/pages/Dashboard.tsx` (render widget)

- Widget shows circular score + tooltip breakdown (4 weighted components).
- `urgencyColor` uses exact hex; each card `aria-label={`Expires in X days, status: fresh`}`.

**Task-local Test Requirements:**
- TR2.2a (rule): tooltip DOM contains the four component labels.
- TR2.3a (rule): card computed background color matches the correct hex for each urgency tier.

---

## Task 8: Realtime sync + conflict resolution in Dashboard

**Priority:** high
**Depends on:** Task 1
**ACs covered:** AC4.3
**Files:** `src/pages/Dashboard.tsx`, `src/lib/realtime.ts`

- Subscribe to `food_items` and `grocery_list` changes for `householdId`.
- On `INSERT`/`UPDATE`/`DELETE`, merge into state; on `UPDATE`, last-write-wins via `updated_at`.
- Auto-reconnect with backoff on `CLOSED`/`CHANNEL_ERROR`; surface a subtle reconnecting toast.

**Task-local Test Requirements:**
- TR4.3a (rule): subscription merges INSERT/UPDATE/DELETE into local state; disconnected state triggers reconnect attempt.

---

## Task 9: Recipe prioritization wiring + grocery gap-filler UI

**Priority:** medium
**Depends on:** Task 3
**ACs covered:** AC3.1, AC3.2, AC3.3
**Files:** `src/components/RecipesView.tsx`, `src/lib/groceryGap.ts`, `src/pages/Dashboard.tsx`

- `RecipesView` uses `prioritizeRecipes` to order recipes; badges show matched urgent ingredients.
- Add "Add missing to grocery list" button per recipe; calls `findMissingIngredients` + `insertGroceryItemsBulk`.

**Task-local Test Requirements:**
- TR3.3b (rule): tapping gap-filler inserts exactly the missing ingredients into grocery state.

---

## Task 10: Skeleton loaders + empty state CTAs

**Priority:** medium
**Depends on:** —
**ACs covered:** AC5.1, AC5.2
**Files:**
- `src/components/Skeleton.tsx` (shared skeleton card)
- `src/components/InventoryView.tsx`, `RecipesView.tsx`, `GroceryView.tsx`, `ScanView.tsx`

- Replace spinner with skeleton grid matching card layout during `loading`.
- Empty states get a primary CTA (Scan receipt / Add item / Add recipe).

**Task-local Test Requirements:**
- TR5.1a (rule): skeleton elements render during loading state.
- TR5.2a (rule): each empty state renders a primary CTA button.

---

## Task 11: Build, lint, typecheck verification

**Priority:** high
**Depends on:** Tasks 1–10
**ACs covered:** AC5.3
**Files:** all

- Run `tsc --noEmit`, `eslint .`, `vite build`, `vitest run`. Fix all failures.
- Confirm no >500kB chunks and zero `any`.

**Task-local Test Requirements:**
- TR5.3a (rule): `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test` all exit 0.
