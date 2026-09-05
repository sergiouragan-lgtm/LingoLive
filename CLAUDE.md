# LingoLive — Design System & Figma Integration Rules

> **Authority order**: User instructions → this file → common sense defaults.
> Never remove, replace, or alter approved flows (auth, welcome, payment, onboarding, dashboard, permissions, data persistence, navigation).

---

## 1. Token Definitions

Design tokens live in **two separate layers** that must never be conflated:

### 1a. CSS layer (authoritative for Tailwind)
`src/index.css` — Tailwind v4 `@theme {}` block:

```css
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --font-display: "Space Grotesk", sans-serif;

  /* Primary brand colour used by Tailwind classes */
  --color-primary: #2563EB;      /* blue — AUTHORITATIVE */
  --color-secondary: #7C3AED;
  --color-accent: #F59E0B;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
}
```

Tailwind class names (`text-primary`, `bg-secondary`, …) resolve from these CSS variables.

### 1b. TypeScript token reference (documentation / TS consumers only)
`packages/design-system/tokens/` — **not** auto-generated into CSS; do not use these values directly in Tailwind classes. They document the "Cosmic Slate" theme intent and may differ from the live CSS:

| File | Purpose |
|---|---|
| `colors.ts` | brand violet `#8B5CF6` / indigo `#6366F1`; semantic success/warning/error/info; accents gold/cyber |
| `typography.ts` | Inter (sans), JetBrains Mono (mono), Space Grotesk / Outfit (display); sizes xs(12px)→xl6(60px) |
| `spacing.ts` | Base-4 scale xs2(2px)→xl8(96px); layout.containerMax = 80rem |
| `elevation.ts` | shadows none/xs/sm/md/lg/xl/xl2; brand/success/warning/error glows |
| `radius.ts` | none=0→full=9999px; xl3=24px is "standard for cards" |
| `animation.ts` | durations instant→verySlow; `pop: cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `zindex.ts` | dropdown=100 sticky=200 overlay=300 drawer=400 modal=500 toast=900 tooltip=1000 |
| `breakpoints.ts` | xs=320 sm=640 md=768 lg=1024 xl=1280 xxl=1536 |
| `icons.ts` | sizes xs=12 sm=16 md=20 lg=24 xl=32 xxl=48 |

> **Critical discrepancy**: `packages/design-system/tokens/colors.ts` brand.primary = `#8B5CF6` (violet); `src/index.css` `--color-primary` = `#2563EB` (blue). The **CSS value is authoritative** for rendered output.

### 1c. Runtime CSS custom properties (component-scoped theming)
Several components use inline `var()` references that are NOT in the Tailwind theme:

```css
var(--accent)     /* indigo/violet accent */
var(--card-bg)    /* card surface */
var(--text)       /* primary text */
var(--border)     /* border colour */
var(--muted)      /* secondary text */
var(--hover-bg)   /* hover state surface */
```

These are defined inside `<style>{...}</style>` blocks within the component file itself (scoped pattern).

---

## 2. Component Library

### Location
```
src/components/
├── core/          # Shell: Sidebar, Topbar, Dashboard, UserProfile, Landing, Onboarding, …
├── auth/          # AuthScreen, WaitingVerificationScreen, SuspendedScreen
├── learning/      # Feature modules
│   ├── ebook/     # 15 ebook components (AI e-book curation platform)
│   ├── aprender/  # LanguagesView
│   ├── quiz/      # LanguageQuiz
│   └── …          # LearningPath, PronunciationModule, etc.
├── ai-tutor/      # PracticeRoom, LiveChatAluno, AIAssistant, conversacao/
├── growth/        # PaymentsView, WelcomeScreen, assinaturas/, …
├── b2b/           # area-escolar/, area-aluno/, area-pais/, area-empresarial/
├── admin/         # FinancialManagementModule
├── live/          # LiveClassesPlatform
├── marketplace/   # MarketplacePlatform
└── compliance/    # PrivacyPolicy
```

### Architecture
- All components are **named exports** (no default-export pattern for feature components).
- Component files are self-contained: props interface → component function → any sub-components → export.
- No Storybook. No component documentation site.
- State is primarily local `useState` + context (`UserRoleContext`, `ToastContext`, `ThemeContext`, `LocalizationContext`, `OnboardingFlowContext`).

---

## 3. Frameworks & Libraries

| Layer | Package | Notes |
|---|---|---|
| UI framework | React 19 | `createRoot`, strict TS |
| Language | TypeScript 5.8 strict | `noEmit` type checks must stay green |
| Styling | Tailwind CSS v4 | `@tailwindcss/vite` plugin; `@theme {}` in `src/index.css` |
| Animation | `motion/react` (Framer Motion v12) | Import from `motion/react`, not `framer-motion` |
| Icons | `lucide-react` | Only icon library in the project |
| Charts | `recharts` | Data visualisation |
| Backend | Firebase 12 | Auth, Firestore, Storage, FCM Messaging |
| Bundler | Vite 6 | `@vitejs/plugin-react`; HMR disabled in config |
| Path alias | `@` → repo root | e.g. `@/src/components/…` |

### Firebase Auth pattern (all API calls)
```ts
const token = await auth.currentUser?.getIdToken();
const res = await fetch(`/api/…`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## 4. Asset Management

### Static assets (`public/`)
| File | Purpose |
|---|---|
| `logo.svg` | LingoLive wordmark |
| `manifest.json` | PWA manifest |
| `sw.js` | Service worker (offline / background sync) |
| `firebase-messaging-sw.js` | FCM push notification service worker |

No `src/assets/` directory exists. There is no CDN configuration.

### Images
Imported inline as data URIs or referenced from `public/` via absolute paths. No asset pipeline (no `imagemin`, no Next.js Image).

### Fonts
Loaded via Google Fonts in `index.html` (Inter, Space Grotesk, JetBrains Mono). Declared in `@theme {}` as CSS font-family variables.

---

## 5. Icon System

**Single source**: `lucide-react` — no SVG sprite files, no custom icon font.

```tsx
import { BookOpen, TrendingUp, RefreshCw } from "lucide-react";

// Usage — always pass explicit size and colour:
<BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
<TrendingUp className="w-5 h-5 text-gray-400" />
```

### Size conventions (matching token `icons.ts`)
| Class | px | Token |
|---|---|---|
| `w-3 h-3` | 12 | xs |
| `w-4 h-4` | 16 | sm |
| `w-5 h-5` | 20 | md |
| `w-6 h-6` | 24 | lg |
| `w-8 h-8` | 32 | xl |
| `w-12 h-12` | 48 | xxl |

Never add SVG files to the project or import from any other icon package.

---

## 6. Styling Approach

### Primary method: Tailwind utility classes
```tsx
<div className="flex items-center justify-between gap-4 py-4 border-b border-gray-100 dark:border-gray-700">
```

### Dark mode
Tailwind `dark:` prefix classes driven by `ThemeContext`. The root div receives `theme-kiditorial` or `theme-corporate` plus `bg-slate-50 text-slate-800`:

```tsx
<div className={`min-h-screen flex font-sans transition-all duration-300 ${
  theme === 'kiditorial'
    ? 'theme-kiditorial bg-slate-50 text-slate-800'
    : 'theme-corporate bg-slate-50 text-slate-800'
}`}>
```

### Scoped styles for complex components
Components with many dynamic colour states use a `<style>` block + `var()` tokens:

```tsx
<style>{`
  .ebook-reader { --card-bg: #1e293b; --text: #f1f5f9; --border: #334155; }
`}</style>
<div style={{ background: "var(--card-bg)", color: "var(--text)" }} />
```

### Inline styles
Used for dynamic values (computed widths, progress bars, chart coordinates). Static colour choices must use Tailwind classes, not inline styles.

### Responsive design
Tailwind breakpoint prefixes: `sm:` `md:` `lg:` `xl:`. No custom media queries. Mobile-first (base = mobile, wider breakpoints override).

### Global styles
`src/index.css`:
- `@import "tailwindcss"` + `@theme {}` block
- Custom keyframes (`@keyframes shimmer`, `@keyframes pulse-glow`)
- `.custom-scrollbar` utility class
- No CSS reset beyond Tailwind's preflight

---

## 7. Project Structure

```
/
├── src/
│   ├── App.tsx                    # Root component; all navigation via `view: AppView` state
│   ├── main.tsx                   # React 19 createRoot; SW registration; PWA install
│   ├── index.css                  # Tailwind v4 entry; @theme {}; global utilities
│   ├── firebase.ts                # Firebase app init; auth, db, storage exports
│   ├── types.ts                   # Shared TypeScript types (AppView enum, etc.)
│   ├── data.ts / data/            # Static data: LANGUAGES, SCENARIOS, VOICES, localizationData
│   ├── context/                   # React contexts: UserRole, Toast, Theme, Localization, OnboardingFlow
│   ├── hooks/                     # Custom hooks (useDeviceOrientation, …)
│   ├── services/                  # Business logic services (SmartProfileEngine, streakNotification, …)
│   ├── analytics/                 # AuditMiddleware, event catalog
│   ├── entryFlow/                 # CentralEntryController (auth routing orchestration)
│   ├── lib/                       # AchievementsManager, utilities
│   ├── profile/                   # SmartProfile types
│   ├── utils/                     # indexedDB, fullscreen, etc.
│   └── components/                # UI components (see §2)
├── packages/
│   └── design-system/
│       ├── README.md              # "Cosmic Slate theme" documentation
│       └── tokens/                # TS token reference (NOT authoritative for CSS)
├── public/                        # Static files served directly
├── vite.config.ts                 # Vite 6 + @tailwindcss/vite; @ alias; HMR disabled
├── index.html                     # Google Fonts links; PWA meta; mount point #root
└── package.json                   # React 19, TS 5.8, Firebase 12, motion/react, recharts
```

### Navigation pattern
All routing is a single `view: AppView` string state in `App.tsx`. Views are switched via `setView("view-name")`. No React Router. The `AppView` union type in `src/types.ts` is the definitive list of valid views.

### Feature organisation
Each major feature is a self-contained directory under `src/components/`. Feature components receive `setView` as a prop to trigger navigation. No shared router context.

### Data persistence hierarchy
1. **Firebase Firestore** — canonical source of truth (user profile, ebook progress, notifications)
2. **IndexedDB** — offline cache (vocab words, streak, achievements)
3. **localStorage** — lightweight flags and session-level preferences

---

## 8. Figma Integration Rules

### When reading Figma designs
- Map Figma colour tokens to `src/index.css` `@theme {}` variables, **not** to `packages/design-system/tokens/`.
- Spacing: Figma 4px grid → Tailwind `gap-1` (4px), `gap-2` (8px), `gap-4` (16px), `gap-6` (24px), `p-6` (24px).
- Radius: cards use `rounded-2xl` (16px) or `rounded-xl` (12px); buttons `rounded-lg` (8px); badges `rounded-full`.
- Shadows: `shadow-sm` for cards; `shadow-md` for modals/drawers.

### When pushing code to Figma
- Use `lucide-react` icon names as Code Connect identifiers.
- Component names in Figma must match the TypeScript named export (e.g. `EbookCurationPlatform` → component `EbookCurationPlatform`).
- Tailwind colour classes map to: `indigo-600` = `#4F46E5`, `slate-900` = `#0F172A`, `gray-100` = `#F3F4F6`.

### Dark mode in Figma
Design both light and dark variants. In code, implement with `dark:` Tailwind prefix classes. The sidebar is always `bg-slate-900 text-white` (no dark variant needed — it's fixed dark).

### Animation
Use `motion/react` (`import { motion, AnimatePresence } from 'motion/react'`). Standard easing: `ease: [0.34, 1.56, 0.64, 1]` (pop). Duration: 200ms micro, 300ms standard, 500ms complex.
