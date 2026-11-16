# Reminiz — handoff for Claude Code

Reminiz is a family app for older adults: daily brain games and family letters (prevention), plus a monthly check-in that compares each person with their own baseline and routes real changes to a doctor (monitoring). Later phases cover life after a diagnosis.

**Source of truth** (export to `docs/` as Markdown, see `docs/README.md`):
- Main plan (Thai): product, MVP1/MVP2, data model, doctor decisions — section "แผนพัฒนา MVP1 / MVP2 และ User journey" is the latest plan and overrides older version names (v0/MVP1 → MVP1, v1.5 → MVP2, v2 → Phase 3, v3 → Phase 4).
- Competition plan (Future Health Challenge 2026, Abu Dhabi): Change Engine, validation, safety.
- Doctor review doc (Google Docs): clinical answers.

**Design reference:** `design/screens/*.png` (rendered mockups) and `design/source/*.dc.html` (HTML mockups, layout and copy only; rebuild them as React Native screens, do not embed the HTML).

## Current release: MVP0 (offline, no backend)

See `docs/mvp0-plan.md` and `docs/release-guide.md`. `apps/mobile` is an Expo app with no network, no login and no data collection: welcome (choose call name) → home tree → Quick Eye game → done. The tree is one round illustrated tree, design C: a crown of overlapping circles in three greens, a Y trunk and line-art grass (`src/tree/roundTree.ts`, drawn with Skia in `src/components/TreeCanvas.tsx`, wind sway on the UI thread; keep per-render objects memoized there or the web preview stops drawing); one flower per day played, up to 7, coloured by the Thai colour of that weekday (`colors.dayBlossom`, not explained in the app); flowers fall and reset every Monday (an MVP0 decision). The home screen follows the device clock (`src/lib/scene.ts`): morning sun and blue clouds, clear blue midday sky with high sun, white clouds and line-art birds, night sky with fireflies (`src/components/SkyCanvas.tsx`). Brand: app icon is a close crop of the round tree on the morning sky: crown edge with two flowers and the sun (`design/brand/app-icon.png`); line-art wordmark logo `design/brand/logo.png` (splash, site); primary green `#2E6C34`. State lives in AsyncStorage (`src/state/store.tsx`). `site/` holds the privacy/terms/support pages deployed to reminiz.renzoft.com on Vercel. Do not add network, analytics, permissions or health claims to MVP0.

## MVP1 scope (deadline 20 Nov 2026)

Build:
1. Caregiver onboarding: email OTP sign-in, create tree for the older adult, "About Mum" (what the family calls her, age, health coverage, conditions, medicines), pair the older adult's device by QR, invite family by link. See `10-SetupCare`.
2. Player mode on the older adult's device: no password, no settings, one big "Play today" / "Start check-in". See `01-Main`.
3. Daily training: Quick Eye (speed-of-processing game, adaptive staircase, target 75–85% accuracy, timing in frames). Memory Album (family photos, errorless: wrong options fade, no scores).
4. Mailbox: family writes letters (text, photo); older adult reads or hears them read aloud; all past letters kept. See `13-Mailbox`, `15-WriteLetter`.
5. Family tree: grows with cumulative care days, a flower for each week with 3 care days; never wilts or resets.
6. Monthly check-in (about 5 min, no reading): pre-test context questions, then 3 tasks that are NOT the training game: Symbol match, Picture memory (delayed recognition), Attention (go/no-go). Multiple alternate forms. See `02`–`04`.
7. Family monthly questions (short, team-written, marked "not validated"). See `06-FamilyInformant`.
8. Change Engine (provisional thresholds, see below).
9. Caregiver report: trend vs own usual range, Brain profile radar (7 axes), "things that may help". See `07-CaregiverReport`.
10. One-page PDF for a doctor visit: trend, context, family answers, medicines, conditions. See `09-DoctorSummary`.
11. Clinician web portal: review queue, decision (repeat / refer by route / no action), audit log. See `11-ClinicianQueue`.
12. Validation dashboard on a simulated cohort (for the competition demo). See `12-Validation`.
13. Languages: English (source), Thai; Arabic RTL for the demo (`05-HomeArabic`).

Not in MVP1 (MVP2 or later): Walk the World / steps (`14-JourneyMap`), IQCODE-16, Thai reference norms, hearing/eye/LDL inputs, Name Practice, UAE routes, Shared device mode, post-diagnosis features, org admin.

## Stack

- Mobile: Expo + Expo Router + TypeScript, EAS Build/Update. Quick Eye with react-native-reanimated (+ react-native-skia if needed). i18next + expo-localization. expo-sqlite for offline check-in results, then sync.
- Backend: Supabase (Auth email OTP, Postgres + Row Level Security, Edge Functions, Storage for photos in MVP1; Cloudflare R2 later).
- Web portal: Next.js, same Supabase and shared types.
- Monorepo suggestion: `apps/mobile`, `apps/portal`, `packages/shared` (types, i18n strings, content packs, change-engine logic), `supabase/` (migrations, functions, seed), `docs/`, `design/`.

## Data model (MVP1)

- `profiles` (caregiver/family accounts), `trees` (one per older adult: display name, call_name, age, coverage, country, locale, timezone, `care_stage` default `monitoring`, nullable `org_id`), `care_stage_history`.
- `tree_members` (tree_id, user_id, role: player | caregiver | family). Unique index on user_id where role = player (a player belongs to one tree). Other roles can join many trees.
- `pairing_codes` (one-time, 10 min).
- `game_sessions` (training: mode, duration, accuracy, frames shown, device model, screen, refresh rate, `client_id` for idempotent sync).
- `assessments` (check-in and family questions: type, version, form_id, item responses jsonb, all candidate metrics: reaction time, accuracy, delayed recall, within-session variability, total time; context answers; device info).
- `letters` (from, body, photo path, voice path, opened_at), `photos` (relative storage path, uploader, answers).
- `medications`, `conditions` (for the PDF).
- `clinician_reviews` (decision, route, note, reviewer, timestamp).
- Care days, flowers and tree stage are computed from sessions, not stored.
- RLS everywhere through one `is_member(tree_id)` function. Private photo bucket, folder per tree_id.

## Change Engine (provisional — doctor-approved rules, thresholds to recalibrate)

- Baseline: check-in 1 is practice (not scored); baseline = mean of check-ins 2–3 within 14 days.
- Use a combined score of the 3 tasks. Reliable Change Index with practice-effect adjustment.
- Stable: combined RCI not below −1.645 and family answers unchanged.
- First decline below −1.645, or family answers changed, or confounders reported → invite to repeat within 2 weeks; message only invites to repeat.
- Lower 2 check-ins in a row, or decline plus family reports worse daily life → clinician review queue. The app never refers on its own.
- Emergency (sudden confusion, face drooping, trouble speaking, new weakness, fall with head injury) → show emergency number immediately (TH 1669, UAE 998; configurable by country).
- RCI parameters in MVP1 come from simulated data; real values must come from normal older adults repeating Reminiz tasks at least twice (MVP2). Keep thresholds in config, not code.
- Store every candidate metric; the primary metric will be chosen from pilot data.

## Referral routes (Thailand, configurable per country)

- Universal Coverage / Social Security → registered primary care unit first.
- Civil Servant → neurology clinic at a public hospital directly.
- Self-pay / private insurance → neurology clinic directly.
- Any coverage: age under 65, rapid decline, or neurological signs → neurologist directly.

## Copy and safety rules

- Never diagnose. Use "signal", "possible change", "not a diagnosis". Never claim the app prevents or slows Alzheimer's.
- Do not use "memory loss / ความจำเสื่อม" on the older adult's screens. Do not show declining scores to the older adult.
- Address the older adult by the family's chosen name (Mum, Dad, Grandma; คุณแม่, คุณพ่อ, คุณยาย).
- Stable result text includes "you can see a doctor at any time if you notice changes".
- All result text comes from reviewed templates per language. No generative AI for health explanations.
- No APOE or genetic risk in the user app. No percentile comparison with other users.
- Standardized tests (MoCA, TMSE < 24, MMSE-Thai 2002) are done by clinicians at visits; never reproduce them in the app.

## Accessibility and i18n

- No hardcoded strings; English source, Thai translation in the same release; RTL support for Arabic.
- Atkinson Hyperlegible (fallback system). Min text 18–20pt for older adult screens, tap targets ≥ 56pt, support Dynamic Type, WCAG AA contrast, audio for every instruction, time only the stimulus display, never the answer.

## Privacy

- Consent per data category, revocable. Thai PDPA (health data is sensitive). Simulated data only for the competition. UAE pilots need UAE hosting.

## Suggested first tasks

1. Scaffold the monorepo, Expo app with Router groups `(player)` and `(family)`, Next.js portal, Supabase project.
2. Migrations + RLS + seed (one family tree, simulated cohort generator for validation).
3. Onboarding + QR pairing + Player mode.
4. Check-in tasks with alternate forms and offline storage.
5. Change Engine as a pure, tested function in `packages/shared`.
6. Report, Brain profile, PDF export.
7. Quick Eye, Memory Album, Mailbox, tree.
8. Clinician portal and validation dashboard.
