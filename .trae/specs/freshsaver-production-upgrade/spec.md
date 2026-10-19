# FreshSaver Production-Grade Upgrade — Specification

## Problem

FreshSaver is currently an MVP food-inventory web app (Vite + React 18 SPA + Supabase) with basic manual inventory entry, simple urgency sorting, and join-code household access. To reach a production-grade, "Eatvora-tier" zero-waste kitchen platform, it must add: multi-modal data ingestion (barcode + hardened receipt OCR), a real-time Pantry Health Score, expiry-weighted AI recipe suggestions, a recipe→grocery gap-filler, secure expiring household invites, real-time multi-user sync, and polished loading/empty states.

## Users & Goals

- **Household members** want instant, low-friction inventory capture (scan barcode/receipt), clear visibility of what is about to expire, recipes that use near-expiry food, and a shared grocery list that fills gaps automatically.
- **Household owners** want secure, revocable invites and role-based access.
- **Shared households** want real-time consistency across every device.

## Non-Goals

- Native mobile app (this is a responsive PWA-style web app).
- Full LLM-hosted recipe generation that requires deploying paid LLM keys in this session — the algorithm + prompt templates will be implemented and wired to an Edge Function stub that returns structured suggestions, keeping the AI path ready to plug in a real provider.
- Payment/billing.

## Constraints & Assumptions

- The app is a **Vite SPA**, not Next.js. All "server-side" operations run as **Supabase Edge Functions** (Deno). No Next.js API routes exist.
- `auth.uid()` + household-membership RLS is the security model; invite tokens and roles extend it.
- Open Food Facts (free, no key) is the barcode product-lookup source.
- Tests run with **Vitest** (unit) — added as a dev dependency. E2E tests are documented as Playwright specs and runnable where the environment permits; core logic is unit-tested.
- Existing optimistic UI and mobile bottom nav (from prior work) remain and are extended, not rewritten.

## Functional Requirements

### 1. Multi-Modal Data Ingestion

**FR1.1 Barcode Scanner** — A barcode scanner entry point in the Add Item flow. It prefers the native `BarcodeDetector` API and falls back to `@zxing/browser`/`@zxing/library`. Handles camera permission denial, scan focus, and unreadable-barcode errors. On successful scan it queries Open Food Facts for product name/category/quantity and pre-fills the Add Item form.

**FR1.2 Receipt OCR Hardening** — `parseReceipt()` validates the Edge Function response against a Zod `receiptParseSchema`. Adds retry (3 attempts, exponential backoff) for transient failures and structured fallback prompting the user to retry or enter manually. Granular error states (network, parse, empty) are surfaced.

### 2. Pantry Health Score & Urgency Matrix

**FR2.1 Pantry Health Score** — A computed 0–100 score, weighted: 35% active inventory utilization (active / total items), 30% shelf-life compliance (items within category default expiry), 25% items not nearing expiration (>2 days), 10% zero-waste streak (capped at 10). A breakdown tooltip explains each component. Score recomputes on every inventory change and via Realtime.

**FR2.2 Urgency Matrix** — Inventory cards use exact WCAG colors: Green `#22c55e` (>5 days), Yellow `#eab308` (3–5 days), Red `#ef4444` (≤48h or expired). Each card carries an `aria-label` announcing expiry status. Colors update automatically as dates approach.

### 3. Urgency-First Recipes & Grocery Gap-Filler

**FR3.1 Expiry-Weighted Recipe Prioritization** — A `prioritizeRecipes` algorithm assigns urgency weights to active items (≤48h → 10×, 3–5d → 5×, >5d → 1×) and ranks recipes by sum of weighted matched ingredients. A penalty reduces rank when recipes skip high-urgency items. ≥90% of returned recipes include at least one ≤48h item when such items exist.

**FR3.2 Smart Grocery Gap-Filler** — From any recipe, one tap cross-references ingredients against active household inventory (name match + unit/quantity), flags missing or insufficient items, and adds them to the shared grocery list with proper units.

### 4. Collaborative Household & Realtime Sync

**FR4.1 Secure Invite Tokens** — An Edge Function `generate-invite` creates a signed, 7-day-expiring token (jwt-style HMAC via Supabase `crypto.subtle`/Deno) for a household + role (owner/member). `accept-invite` verifies, marks consumed (non-reusable), and joins the user to the household with the role. Owners can revoke pending invites and remove members.

**FR4.2 Realtime Sync** — `Dashboard` subscribes to Supabase Realtime on `food_items` and `grocery_list` for the household, with auto-reconnect (backoff) and last-write-wins conflict resolution keyed on `updated_at`. Changes reflect across devices.

### 5. UI/UX Polish

**FR5.1 Skeleton Loaders** — Inventory, recipes, grocery, and receipt-processing views show layout-matched skeleton cards during loading.

**FR5.2 Empty States** — Context-specific empty states with primary CTAs (scan receipt / add item / add recipe) and micro-animations; screen-reader accessible.

## Non-Functional Requirements

- **Accessibility:** WCAG 2.1 AA contrast on urgency colors; `aria-label`s on status; keyboard-operable controls.
- **Performance:** Optimistic UI keeps perceived interaction latency <100ms; code-splitting retained.
- **Security:** No secrets client-side; invite tokens verified server-side; RLS policies cover all new tables.
- **Type safety:** Zero `any`; strict TypeScript.

## Acceptance Criteria

| ID | Type | Criterion |
|----|------|-----------|
| AC1.1 | rule | Barcode scanner component exists, prefers `BarcodeDetector`, falls back to zxing, and surfaces permission/scan errors to the user. |
| AC1.2 | rule | Open Food Facts lookup prefills the Add Item form (name + quantity + category when available). |
| AC1.3 | rule | `receiptParseSchema` (Zod) validates receipt OCR output; invalid payloads trigger a manual-entry prompt. |
| AC1.4 | rule | Receipt OCR retries transient failures up to 3 times with backoff. |
| AC2.1 | rule | `calculatePantryScore()` returns 0–100 with the 35/30/25/10 weighting and is unit-tested across empty / all-expired / all-fresh inventories. |
| AC2.2 | rule | Pantry score breakdown tooltip shows the four weighted components. |
| AC2.3 | rule | Inventory urgency colors are exactly green `#22c55e` / yellow `#eab308` / red `#ef4444` with `aria-label` expiry status. |
| AC3.1 | rule | `prioritizeRecipes()` weights ≤48h items 10×, 3–5d 5×, >5d 1× and penalizes skipping critical items. |
| AC3.2 | rule | ≥90% of prioritized recipes include a ≤48h item when critical items exist (unit test). |
| AC3.3 | rule | Grocery gap-filler identifies missing/insufficient recipe ingredients and inserts them into `grocery_list`. |
| AC4.1 | rule | `household_invites` table exists with token, expires_at, role, consumed_at, revoked; RLS restricts to household owner. |
| AC4.2 | rule | Invite tokens expire after 7 days and cannot be reused (consumed_at set on acceptance). |
| AC4.3 | rule | Realtime subscriptions to `food_items` and `grocery_list` update local state with auto-reconnect on disconnect. |
| AC5.1 | rule | Skeleton loaders render for inventory/recipes/grocery during `loading`. |
| AC5.2 | rule | Empty inventory/recipes/grocery states show a primary CTA button. |
| AC5.3 | rubric | Code-splitting, type safety (zero `any`), and lint/build pass — build succeeds with no >500kB chunks and `tsc --noEmit` clean. |
