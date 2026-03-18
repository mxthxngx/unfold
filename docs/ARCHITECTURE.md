# Unfold — Architecture Guide

> This document is the single source of truth for any LLM or engineer working
> on the Unfold codebase. Read it before making changes.

---

## Table of Contents

1. [What Unfold Is](#what-unfold-is)
2. [Tech Stack](#tech-stack)
3. [Directory Map](#directory-map)
4. [Runtime Flow](#runtime-flow)
5. [Routing](#routing)
6. [State Management](#state-management)
7. [CSS Token Architecture (Three-Layer Model)](#css-token-architecture-three-layer-model)
8. [Customization System](#customization-system)
9. [Component Architecture](#component-architecture)
10. [Editor Model](#editor-model)
11. [File Naming Conventions](#file-naming-conventions)
12. [Import Conventions](#import-conventions)
13. [Patterns to Follow](#patterns-to-follow)
14. [Patterns to Avoid](#patterns-to-avoid)
15. [Adding a New User-Configurable Property](#adding-a-new-user-configurable-property)
16. [Adding a New Feature](#adding-a-new-feature)
17. [Package Inventory](#package-inventory)

---

## What Unfold Is
Its "unfold", not "Unfold". unfold, is a calm mindspace, with minimal aesthetics and a beautiful ui, thats clean, and customisable. unfold, is a place where you quickly jot down a thought, or make intense notes without the headache of clutter. it has microinteractions on hover, any action or state change, to enhance the experience of the user.


Unfold is a Tauri v2 desktop application — a local-first, keyboard-driven notes
editor with rich text editing (TipTap/ProseMirror), multi-space workspaces,
full typography customization, and a VS Code-style runtime theming system.

The frontend is React 19 + TypeScript. The backend is Rust (Tauri). Data is
stored locally in SQLite (documents) and a JSON settings store (preferences).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Shell | Tauri v2 (Rust backend, webview frontend) |
| UI Framework | React 19 |
| Routing | TanStack Router (file-based params, loaders) |
| State | Redux Toolkit + RTK Query |
| Editor | TipTap v3 / ProseMirror |
| Styling | Tailwind CSS v4 (`@theme inline`, CSS custom properties) |
| Animation | `motion` (Motion One — the successor to framer-motion) |
| Icons | `lucide-react` (sole icon library) |
| Build | Vite 7 |

---

## Directory Map

```
src/
├── app.tsx                        # Root component. Calls useThemeBootstrap(), wraps with SidebarProvider.
├── main.tsx                       # ReactDOM entry point.
├── router.tsx                     # TanStack Router: route tree, loaders, redirects.
│
├── pages/                         # Route-level page components (not reusable UI).
│   ├── index-page.tsx             # Landing / empty workspace page.
│   └── empty-state.tsx            # Zero-files empty state CTA.
│
├── layout/                        # Application shell — customization injection point.
│   └── editor-layout.tsx          # THE most important non-UI file. Injects --unfold-* CSS
│                                  # vars from user customization onto the root element.
│                                  # Renders <Toolbar>, <Sidebar>, <SearchBar>, <SidebarInset>.
│
├── components/                    # Domain-agnostic, reusable UI only. (AGENTS.md boundary)
│   ├── atoms/                     # Pure visual primitives. Zero domain knowledge.
│   │   ├── expand-chevron-icon.tsx
│   │   ├── icon-action-button.tsx
│   │   ├── panel-card.tsx         # Rounded card shell (border + bg).
│   │   ├── primary-action-button.tsx  # CTA button with Ripple.
│   │   ├── row-actions-reveal.tsx # Hover-reveal action tray for sidebar rows.
│   │   ├── selectable-row.tsx     # Pressable row with selected/unselected states.
│   │   └── small-text-label.tsx   # Section label (e.g., "pinned", "notes").
│   │
│   ├── molecules/                 # Domain-agnostic compositions of atoms.
│   │   ├── choice-row.tsx         # Radio-style option row with Ripple.
│   │   ├── confirmation-modal.tsx # Generic confirm/cancel modal shell.
│   │   ├── dropdown-field-shell.tsx   # Label + dropdown trigger + error.
│   │   ├── editor-bubble-dropdown.tsx # Dropdown for editor bubble menus.
│   │   ├── filter-toggle-card.tsx     # Toggle card with inline switch.
│   │   ├── footer-action-bar.tsx      # Footer bar with hint + primary/secondary buttons.
│   │   ├── form-field.tsx             # Label + children + error/helper.
│   │   ├── inline-rename-input.tsx    # Inline text input for rename flows.
│   │   ├── panel-section.tsx          # PanelCard with header, description, body.
│   │   ├── row-icon-actions.tsx       # Icon action buttons revealed on row hover.
│   │   ├── sidebar-children-collapse.tsx  # Animated collapse for sidebar tree children.
│   │   ├── sidebar-node-context-menu.tsx  # Context menu for sidebar nodes.
│   │   ├── sidebar-node-row.tsx       # Full sidebar row (icon, name, actions, chevron).
│   │   └── toolbar-sidebar-toggle.tsx # Animated sidebar toggle button.
│   │
│   ├── breadcrumbs/               # Breadcrumb navigation (well-decomposed, leave alone).
│   ├── common/                    # Cross-cutting shared components.
│   │   ├── delete-confirmation-modal.tsx  # Thin preset wrapper around ConfirmationModal.
│   │   ├── global-selection-highlighter.tsx  # CSS Highlight API integration.
│   │   └── scrollable-container.tsx   # Custom scrollbar wrapper.
│   │
│   ├── editor/                    # TipTap editor components, extensions, styles.
│   │   ├── components/            # Editor sub-components (bubble menu, slash menu, etc.).
│   │   ├── extensions/            # TipTap extensions and helpers.
│   │   ├── styles/                # Editor-specific CSS (co-located, not in /styles).
│   │   ├── page-editor.tsx        # Main document editor instance.
│   │   ├── title-editor.tsx       # Document title editor instance.
│   │   ├── full-page-editor.tsx   # Combines title + page editor.
│   │   └── editor-skeleton.tsx    # Loading skeleton.
│   │
│   ├── skeletons/                 # Loading skeletons.
│   └── ui/                        # Radix/shadcn primitives (button, dialog, popover, etc.).
│
├── features/                      # Domain-specific behavior and orchestration.
│   ├── sidebar/
│   │   ├── components/
│   │   │   ├── sidebar.tsx        # Full sidebar: space header, tree, footer. Uses Redux, FS, routing.
│   │   │   ├── sidebar-tree-nodes.tsx  # Recursive tree renderer.
│   │   │   ├── space-switcher-menu.tsx # Space list with rename/delete/create.
│   │   │   └── create-space-modal.tsx  # New space form modal.
│   │   └── lib/
│   │       └── recently-created-node.ts
│   │
│   ├── search/
│   │   └── components/
│   │       ├── search-bar.tsx     # Find/replace bar. Uses ProseMirror state, app events.
│   │       ├── search-input-row.tsx
│   │       └── search-replace-row.tsx
│   │
│   ├── settings/
│   │   ├── components/            # Customizability UI, typography rows, preview.
│   │   ├── controls/              # Font picker dropdown.
│   │   ├── constants/             # Typography row configs.
│   │   └── hooks/                 # use-customization-draft, use-system-fonts.
│   │
│   └── toolbar/
│       ├── components/
│       │   ├── toolbar.tsx        # Top toolbar: breadcrumbs, settings trigger, add file.
│       │   └── settings-modal.tsx # Export/import/appearance/customizability modal.
│       └── hooks/                 # use-export-actions, use-import-actions, use-relative-edited-time.
│
├── store/                         # Redux Toolkit state management.
│   ├── api/
│   │   └── app-api.ts             # RTK Query: getWorkspace, mutations for CRUD.
│   ├── hooks/
│   │   ├── use-editor-registry.ts # Editor ref management (title + page editors).
│   │   ├── use-filesystem-store.ts    # File tree, CRUD, node selection, active space.
│   │   ├── use-layout-store.ts        # Sidebar position, layout settings.
│   │   └── use-theme-store.ts         # Theme preference, resolved theme, bootstrap.
│   ├── slices/
│   │   ├── ui-slice.ts            # Theme preference, active space, pending file.
│   │   └── customization-slice.ts # Per-space and per-theme customization properties.
│   ├── hooks.ts                   # useAppDispatch, useAppSelector typed wrappers.
│   ├── index.ts                   # configureStore + persistence middleware.
│   ├── selectors.ts               # Memoized selectors.
│   └── theme.ts                   # Theme types, resolve logic, DOM apply.
│
├── services/                      # Persistence adapters (no React, no Redux).
│   ├── database.ts                # SQLite via @tauri-apps/plugin-sql.
│   ├── settings-store.ts          # JSON key-value via @tauri-apps/plugin-store.
│   ├── customization-storage.ts   # Save/load customization state to localStorage.
│   └── customization-resolver.ts  # Pure function: merge app + space overrides.
│
├── config/                        # Static configuration and defaults.
│   ├── customization-defaults.ts  # Default values for every CustomizationPropertyKey.
│   ├── database.ts                # DB config constants.
│   └── keyboard-shortcuts.ts      # Shortcut definitions.
│
├── types/                         # Shared TypeScript types.
│   ├── customization.ts           # CustomizationPropertyKey, CustomizationProperty, etc.
│   ├── layout.ts                  # Layout, SidebarPosition.
│   └── sidebar.ts                 # Node (sidebar tree node type).
│
├── lib/                           # Pure utilities (no React, no state).
│   ├── utils.ts                   # cn() — THE single source. clsx + tailwind-merge.
│   ├── tiptap-utils.ts            # Editor helpers: node finders, key formatters, upload logic.
│   ├── motion.ts                  # Animation constants: easing curves, spring configs, durations.
│   ├── file-tree.ts               # Tree traversal helpers (findFirstFileId, findNodeById, etc.).
│   ├── space-selection.ts         # resolveInitialSpaceId.
│   └── app-events.ts              # Typed custom event bus (OPEN_FIND_DIALOG, etc.).
│
├── hooks/                         # Truly cross-cutting React hooks.
│   ├── use-custom-scrollbar.ts
│   ├── use-global-sidebar-shortcuts.ts
│   ├── use-layout-config.ts
│   ├── use-mobile.ts
│   ├── use-settings.ts
│   └── use-sidebar-context-menu.ts
│
├── utils/                         # Non-React utility modules.
│   ├── print.ts                   # PDF/print export logic.
│   ├── web-import.ts              # Website article import/extraction.
│   ├── invoke.ts                  # Typed Tauri invoke wrapper.
│   ├── last-opened.ts             # Per-space last-opened file tracking.
│   └── customization-validation.ts
│
├── styles/
│   ├── tailwind.css               # Entry point: font imports, base resets, @import token layers,
│   │                              # editor typography rules, sidebar rules, scrollbar rules.
│   └── tokens/
│       ├── unfold-primitives.css  # LAYER 1: --unfold-* user-configurable vars.
│       ├── semantic-dark.css      # LAYER 2: Dark mode semantic tokens (references Layer 1).
│       ├── semantic-light.css     # LAYER 2: Light mode overrides (.light selector).
│       └── theme-mapping.css      # LAYER 3: @theme inline — maps Layer 2 → Tailwind utilities.
│
├── icons/                         # Custom SVG icon components (if any).
└── assets/                        # Static assets.
```

---

## Runtime Flow

```
┌─────────────┐
│   main.tsx   │  ReactDOM.createRoot → <App />
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   app.tsx    │  useThemeBootstrap() → applies .dark/.light class
│              │  <SidebarProvider> → <RouterProvider>
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│   router.tsx      │  Route tree: rootRoute → indexRoute / spaceIndexRoute / fileRoute
│                    │  rootRoute.component = <EditorLayout><Outlet /></EditorLayout>
│                    │  Loaders: ensure workspace subscription, resolve space, redirect to file.
└──────┬────────────┘
       │
       ▼
┌──────────────────┐
│  editor-layout   │  Reads customization state from Redux.
│                    │  Computes --unfold-* CSS overrides via USER_PRIMITIVE_MAP.
│                    │  Applies them as style={} on root div.
│                    │  Renders: <Toolbar> + <Sidebar> + <SidebarInset>{children}</SidebarInset> + <SearchBar>
└──────┬────────────┘
       │
       ▼
┌──────────────────┐
│  FullPageEditor   │  <TitleEditor> + <PageEditor>
│                    │  Each is an independent TipTap editor instance.
└──────────────────┘
```

---

## Routing

Routes are defined in `src/router.tsx` using TanStack Router.

| Route | Component | Loader behavior |
|---|---|---|
| `/` | `IndexPage` | Resolves active space → redirects to file or space. |
| `/spaces/$spaceId` | `IndexPage` | Validates space → redirects to preferred file. |
| `/spaces/$spaceId/files/$fileId` | `FullPageEditor` | Validates space + file → renders editor. |

All routes share `rootRoute` which wraps content in `<EditorLayout>`.

The router receives `{ store }` as context so loaders can dispatch Redux actions
and read state (e.g., `selectActiveSpaceId`, `appApi.endpoints.getWorkspace.initiate()`).

---

## State Management

### Redux Store shape

```
{
  appApi: { ... },          // RTK Query cache (workspace snapshot, mutations).
  ui: {
    themePreference,        // 'light' | 'dark' | 'system'
    activeSpaceId,          // Current workspace space.
    pendingFileId,          // Optimistic file selection during creation.
  },
  customization: {
    byThemeId: { ... },     // App-level customization (keyed by 'app-default').
    bySpaceId: { ... },     // Per-space overrides.
  }
}
```

### Store hooks (the only way to access state)

| Hook | Location | Purpose |
|---|---|---|
| `useThemeStore()` | `store/hooks/use-theme-store.ts` | Theme preference, resolved theme, setTheme. |
| `useThemeBootstrap()` | same file | Apply resolved theme class to `<html>`. Called once in app.tsx. |
| `useLayoutStore()` | `store/hooks/use-layout-store.ts` | Layout settings (sidebar position). |
| `useEditorRegistry()` | `store/hooks/use-editor-registry.ts` | Refs to title/page editor instances. |
| `useFileSystemStore()` | `store/hooks/use-filesystem-store.ts` | File tree, CRUD, space management. |
| `useAppDispatch()` | `store/hooks.ts` | Typed dispatch. |
| `useAppSelector()` | `store/hooks.ts` | Typed selector. |

**There are no React contexts for state.** The old `src/contexts/` folder was removed.
All state flows through Redux.

### Persistence

The store's persistence middleware (`src/store/index.ts`) automatically saves:
- Theme preference → `localStorage`
- Active space → `localStorage`
- Customization state → `localStorage` (via `customization-storage.ts`)

Workspace data (files, spaces) persists through the Tauri backend (SQLite).

---

## CSS Token Architecture (Three-Layer Model)

This is the most important architectural decision for styling. **Tailwind v4's
`@theme` block is compiled at build time and cannot change at runtime.** CSS
custom properties CAN be overridden at runtime via `style={}`. These two facts
drive the entire three-layer design.

### Layer 1 — User-Configurable Primitives

**File:** `src/styles/tokens/unfold-primitives.css`

Small, intentional set of CSS variables that the user can customize. These are
the ONLY variables that `EditorLayout` injects at runtime via `style={}`.

```css
:root {
  --unfold-accent:        rgb(167, 139, 250);
  --unfold-bg:            #0d0d0c;
  --unfold-fg:            #f7f2f2;
  --unfold-font-sans:     "DM Sans";
  --unfold-font-display:  "Bricolage Grotesque";
  --unfold-size-editor:   0.9375rem;
  --unfold-radius:        0.625rem;
  /* ... etc ... */
}
```

**Rules:**
- Every var here has a matching `CustomizationPropertyKey` in `types/customization.ts`.
- Every var here has a default in `config/customization-defaults.ts`.
- Nothing reads these directly except Layer 2.

### Layer 2 — Semantic Tokens

**Files:** `src/styles/tokens/semantic-dark.css`, `semantic-light.css`

The full set of ~330 CSS variables. Foundation tokens (background, foreground,
accent, fonts, sizes) reference Layer 1. Everything else is hardcoded per theme.

```css
:root {
  --background-solid: var(--unfold-bg);
  --foreground:       var(--unfold-fg);
  --highlight-vivid:  var(--unfold-accent);
  --font-sans:        var(--unfold-font-sans), sans-serif;
  --font-size-note:   var(--unfold-size-editor);
  --sidebar:          #0f0f0f;          /* not user-configurable */
  /* ... hundreds more ... */
}
```

### Layer 3 — Tailwind Theme Mapping

**File:** `src/styles/tokens/theme-mapping.css`

The `@theme inline` block that maps Layer 2 semantic tokens to Tailwind utility
classes. Compiled at build time. Never changes at runtime.

```css
@theme inline {
  --color-background:  var(--background);
  --color-foreground:  var(--foreground);
  --radius-lg:         var(--radius);
  --text-sm:           var(--font-size-sm);
  /* ... etc ... */
}
```

### How the cascade works

```
EditorLayout style={}  →  --unfold-font-sans: "Inter"
        ↓
Layer 1 (primitives)   →  --unfold-font-sans: "Inter" (overridden)
        ↓
Layer 2 (semantic)     →  --font-sans: var(--unfold-font-sans), sans-serif  →  "Inter", sans-serif
        ↓
Layer 3 (theme)        →  --font-sans: "Inter", sans-serif (compiled into Tailwind's font-sans utility)
        ↓
Component              →  className="font-sans"  →  renders in Inter
```

### Typography Scale

| Token | Tailwind class | Default size |
|---|---|---|
| `--font-size-2xs` | `text-2xs` | 11px |
| `--font-size-xs` | `text-xs` | 12px |
| `--font-size-sm` | `text-sm` | ~13px |
| `--font-size-md` | `text-base` | 15px |
| `--font-size-lg` | `text-lg` | 18px |
| `--font-size-xl` | `text-xl` | 20px |
| `--font-size-2xl` | `text-2xl` | 28px |
| `--font-size-3xl` | `text-4xl` | 36px |
| `--font-size-code` | `text-code` | 13px |

**Never use arbitrary values like `text-[13px]` or `text-[0.82rem]`.** Always
use the token-based classes above.

---

## Customization System

### How it works

1. **Types:** `CustomizationPropertyKey` defines every configurable property
   (e.g., `'editor.fontFamily'`, `'h1.fontSize'`).

2. **Defaults:** `config/customization-defaults.ts` has the default value for each key.

3. **Storage:** `customization-slice.ts` stores overrides per-space and per-theme.
   `customization-storage.ts` persists to localStorage.

4. **Resolution:** `customization-resolver.ts` merges app defaults + space overrides
   into a flat resolved map.

5. **Injection:** `editor-layout.tsx` reads the resolved map and produces a
   `style={}` object mapping `CustomizationPropertyKey → --unfold-* CSS var`.
   This is the `USER_PRIMITIVE_MAP`:

```typescript
const USER_PRIMITIVE_MAP: Array<[CustomizationPropertyKey, string]> = [
  ['body.fontFamily',   '--unfold-font-sans'],
  ['editor.fontFamily', '--unfold-font-sans'],
  ['title.fontFamily',  '--unfold-font-display'],
  ['editor.fontSize',   '--unfold-size-editor'],
  ['h1.fontSize',       '--unfold-size-h1'],
  // ...
];
```

6. **Cascade:** Layer 2 semantic tokens reference Layer 1, so all downstream
   components respond automatically.

---

## Component Architecture

### Boundary Rules

```
src/components/*  =  shared, domain-agnostic, reusable
src/features/*    =  domain-specific behavior, Redux wiring, routing
src/pages/*       =  route-level page components
src/layout/*      =  application shell
```

- `components/` must NOT import from `features/`.
- `features/` CAN import from `components/`.
- If something is reused across 2+ features and is generic → promote to `components/`.

### Shared component library

| Category | Purpose | Examples |
|---|---|---|
| `atoms/` | Pure visual primitives | `PanelCard`, `IconActionButton`, `SelectableRow` |
| `molecules/` | Compositions of atoms | `FormField`, `ConfirmationModal`, `FooterActionBar` |
| `ui/` | Radix/shadcn primitives | `Button`, `Dialog`, `DropdownMenu`, `Modal`, `Tooltip` |
| `common/` | Cross-cutting shared | `DeleteConfirmationModal`, `ScrollableContainer` |

### Button variants

The `Button` component (`ui/button.tsx`) uses CVA with these variants:

| Variant | Use case |
|---|---|
| `default` | Standard button with bg + border |
| `outline` | Outlined with lighter bg (color/border only, no structural overrides) |
| `error` | Destructive action (red palette) |
| `transparent` | Ghost-like with sidebar hover states |
| `ghost` | Minimal ghost button |
| `link` | Text link style |

Sizes: `default`, `sm`, `lg`, `action` (modal footers), `icon`, `icon-sm`, `icon-lg`.

**Important:** The `outline` variant does NOT declare structural properties
(`inline-flex`, `items-center`, `px-4`, `py-2`). Those are in the CVA base.
This keeps size variants orthogonal.

---

## Editor Model

- **Two editor instances per document:** `TitleEditor` (single h1) and `PageEditor`
  (full document body). They are separate TipTap instances that coordinate focus.
- **Editor refs** are managed by `useEditorRegistry()` (`pageEditorRef`, `titleEditorRef`).
- **Extensions** are defined in `components/editor/extensions/`.
- **Bubble menu** components live in `components/editor/components/bubble-menu/`.
- **Slash command** is in `components/editor/extensions/slash-command.ts` with
  `command-list-view.tsx` for rendering.
- **Editor CSS** is co-located in `components/editor/styles/`. These are
  domain-specific and should NOT be moved to `src/styles/`.
- **Font families** in ProseMirror rules use Layer 2 semantic tokens (`--font-sans`,
  `--font-sans-serif`, `--font-mono`) which cascade from Layer 1.

---

## File Naming Conventions

- **kebab-case** for all files and directories in `src/`:
  - ✅ `customizability-section.tsx`, `font-picker.tsx`, `sidebar-node-row.tsx`
  - ❌ `CustomizabilitySection.tsx`, `FontPicker.tsx`
- **PascalCase** for component identifiers inside files.
- **camelCase** for hooks, utilities, non-component exports.

---

## Import Conventions

### `cn()` utility

**Always import from `@/lib/utils`.** Never from `@/lib/tiptap-utils`.

```typescript
import { cn } from '@/lib/utils';
```

### Animation

**Always import from `motion/react`.** Never from `framer-motion`.

```typescript
import { motion, AnimatePresence } from 'motion/react';
```

### Animation constants

```typescript
import { SIDEBAR_EASE, SIDEBAR_SHELL_TWEEN } from '@/lib/motion';
```

### Store hooks

```typescript
import { useFileSystemStore } from '@/store/hooks/use-filesystem-store';
import { useThemeStore, useThemeBootstrap } from '@/store/hooks/use-theme-store';
import { useEditorRegistry } from '@/store/hooks/use-editor-registry';
import { useLayoutStore } from '@/store/hooks/use-layout-store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
```

### Icons

**Always use `lucide-react`.** No other icon packages.

```typescript
import { Plus, ChevronDown, X } from 'lucide-react';
```

---

## Patterns to Follow

### 1. Use token classes, never arbitrary values

```typescript
// ✅ Good
className="text-sm text-modal-surface-foreground/92"
className="text-2xs font-medium"
className="text-xs text-destructive"

// ❌ Bad
className="text-[13px]"
className="text-[0.82rem]"
className="text-[10px]"
className="text-[11px]"
```

### 2. Use CSS vars for dynamic colors, never inline color-mix

```typescript
// ✅ Good — references a named CSS var
<Ripple color="var(--unfold-ripple-item)" />

// ❌ Bad — inline color computation
<Ripple color="color-mix(in srgb, var(--sidebar-item-hover-bg) 82%, transparent)" />
```

### 3. One customization key → one Layer 1 primitive

```typescript
// ✅ Good — single mapping, cascade handles the rest
['editor.fontSize', '--unfold-size-editor']

// ❌ Bad — one key mapped to multiple CSS vars
['editor.fontSize', ['--font-size-editor-base', '--font-size-note']]
```

### 4. Feature boundary: Redux/routing → features/, visual-only → components/

If a component imports from `@/store/`, `@tanstack/react-router`, or uses
`useAppDispatch` / `useNavigate`, it is a **feature component** and belongs
in `src/features/<feature>/components/`.

### 5. Composition over size

If a file exceeds ~250 lines, decompose:
1. Extract pure visual primitives → `atoms/`
2. Extract interaction blocks → `molecules/`
3. Keep wiring (Redux, routing) in `features/<feature>/`

---

## Patterns to Avoid

| ❌ Don't | ✅ Do instead |
|---|---|
| Import `cn` from `@/lib/tiptap-utils` | Import from `@/lib/utils` |
| Use `framer-motion` | Use `motion/react` |
| Use `react-icons` or `@radix-ui/react-icons` | Use `lucide-react` |
| Create context providers for state | Use Redux store hooks directly |
| Put feature components in `components/` | Put them in `features/<feature>/` |
| Use `text-[Npx]` arbitrary Tailwind values | Use `text-2xs`, `text-xs`, `text-sm`, etc. |
| Use inline `color-mix()` JS strings | Define a CSS var in `unfold-primitives.css` |
| Map one customization key to multiple CSS vars | Map to one `--unfold-*` var; let Layer 2 cascade |
| Put route-level pages in `components/` | Put them in `pages/` |
| Hardcode `--custom-*-font` overrides | Use the `--unfold-font-*` → `--font-*` cascade |

---

## Adding a New User-Configurable Property

Example: adding accent color customization.

### Step 1 — Type key

```typescript
// src/types/customization.ts
export type CustomizationPropertyKey =
  | 'editor.fontFamily'
  // ...existing keys...
  | 'accent.color';       // ← add this
```

### Step 2 — Default value

```typescript
// src/config/customization-defaults.ts
export const customizationDefaultValues: Record<CustomizationPropertyKey, ...> = {
  // ...existing...
  'accent.color': { value: 'rgb(167, 139, 250)', type: 'color' },
};
```

### Step 3 — Primitive map entry

```typescript
// src/layout/editor-layout.tsx → USER_PRIMITIVE_MAP
['accent.color', '--unfold-accent'],
```

**That's it.** Every component using `text-highlight-vivid`, `bg-highlight`,
`selection-ring`, etc. will respond automatically because they cascade from
`--unfold-accent` through Layer 2.

### Step 4 (optional) — Build the UI

Add a color picker in `features/settings/components/` that dispatches
`setCustomizationProperty({ key: 'accent.color', value: '#ff0000' })`.

---

## Adding a New Feature

1. Create `src/features/<name>/components/` for UI.
2. Create `src/features/<name>/hooks/` for feature-specific hooks.
3. Import shared components from `@/components/`.
4. Wire state through existing store hooks or create new slice if needed.
5. Add routes in `router.tsx` if the feature has its own page.

---

## Package Inventory

### Production Dependencies — actively used

| Package | Purpose |
|---|---|
| `@radix-ui/react-*` | Accessible UI primitives (dialog, dropdown, popover, tooltip, etc.) |
| `@reduxjs/toolkit` | State management + RTK Query |
| `@tanstack/react-router` | Type-safe routing with loaders |
| `@tauri-apps/api` | Tauri IPC bridge |
| `@tauri-apps/plugin-*` | FS, SQL, Store plugins |
| `@tiptap/*` | Rich text editor framework |
| `class-variance-authority` | Variant-based className composition (Button, etc.) |
| `clsx` + `tailwind-merge` | `cn()` utility |
| `lucide-react` | Icon library (sole source of icons) |
| `motion` | Animation library (successor to framer-motion) |
| `html2canvas` + `jspdf` | PDF export |
| `markdown-it` | Markdown parsing for import |
| `tippy.js` | Tooltip positioning (used by TipTap bubble menu) |
| `uuid` | ID generation |
| `yjs` + `y-protocols` | CRDT (peer dependencies of `@tiptap/y-tiptap`) |

### Removed Dependencies (do not re-add)

| Package | Reason removed |
|---|---|
| `framer-motion` | Consolidated into `motion` (same author, `motion` is the successor) |
| `react-icons` | Replaced with `lucide-react` (single icon source) |
| `@radix-ui/react-icons` | Replaced with `lucide-react` |
| `sass-embedded` | Not used (project uses Tailwind CSS v4, no Sass) |
| `serve` | Dev utility, not needed |
| `@types/tippy.js` | tippy.js ships its own types |