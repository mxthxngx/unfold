# Frontend Restructure Plan — Unfold

> **Status:** Proposal — Not yet implemented
> **Last updated:** 2025
> **Inspired by:** Docmost's feature-first architecture

---

## 1. Motivation

The current `src/` directory mixes concerns freely. The editor is buried inside
`components/` even though it is a first-class feature. Layout wrappers,
route-level pages, business logic hooks, and raw database drivers all sit at
the same depth with no clear ownership. Adding anything new requires guessing
where it belongs.

The goals of this restructure are:

- **Feature cohesion.** Every feature owns its own components, hooks, atoms,
  types, services, and constants. Nothing leaks out unless it is truly shared.
- **A real `core/` layer.** App-specific processing logic — Redux store,
  services, events, theme, config, types — lives in one place that features
  and pages depend on.
- **A `painter/` seam inside `core/`.** The future `Painter` singleton that
  will apply theme/style mutations at runtime gets a home now. Implementation
  is deferred; the directory is committed so the pattern is established.
- **`components/layouts/`** for layout wrappers, following docmost exactly.
  Layouts are not features and they are not pages — they are route-level
  shells used by the router via `<Outlet />`.
- **`pages/`** for thin route files. One file per route. No logic.
- **`lib/`** for neutral, app-agnostic utilities and hooks that have no feature
  affiliation and no knowledge of the app's domain.
- **Delete everything unused.** No stale abstractions, no orphaned folders.
- **Type-safety over JSON schemas.** TypeScript is the single source of truth.
  No Atom-style JSON config registries.

---

## 2. What Gets Deleted

These paths are removed. Concerns are absorbed into the correct new home.

| Path | Reason |
|------|--------|
| `src/components/atoms/` | Micro-components absorbed into `ui/` or the owning feature |
| `src/components/molecules/` | Composite components absorbed into the owning feature |
| `src/components/skeletons/` | Absorbed into `pages/` or the owning feature |
| `src/components/breadcrumbs/` | Absorbed into `features/editor/components/` |
| `src/components/editor/` | Promoted to `features/editor/` |
| `src/components/common/` | Split — generic pieces to `ui/`, feature pieces to their feature |
| `src/layout/` | Becomes `components/layouts/global/editor-layout.tsx` |
| `src/store/` | Moves to `core/store/` (hooks sub-folder absorbs use-filesystem-store, use-layout-store) |
| `src/services/` | Moves to `core/services/` (customization-resolver joins here too) |
| `src/lib/` | Split — app-specific pieces (`file-tree`, `space-selection`, `app-events`) to `core/`, neutral pieces (`utils`, `motion`) to `lib/` or owning feature |
| `src/config/` | Moves to `core/config/` |
| `src/types/` | Moves to `core/types/` |
| `src/hooks/` | Split — feature-specific to their feature, neutral to `lib/` |
| `src/utils/` | Split — app-specific to `core/utils/`, neutral to `lib/` |
| `src/icons/` | Absorbed into `ui/icons/` |

---

## 3. Proposed Directory Structure

```
src/
│
├── main.tsx                      # Entry point — unchanged
├── app.tsx                       # Root component — unchanged
├── router.tsx                    # TanStack Router — unchanged
├── vite-env.d.ts
│
│   ╔══════════════════════════════════════════════════════════════╗
│   ║  CORE  —  App-specific processing logic. No UI.            ║
│   ║  Features and pages depend on core. Core depends on        ║
│   ║  nothing inside src/ except itself.                        ║
│   ╚══════════════════════════════════════════════════════════════╝
│
├── core/
│   │
│   ├── config/
│   │   ├── customization-defaults.ts   # (from src/config/customization-defaults.ts)
│   │   ├── database.ts                 # (from src/config/database.ts)
│   │   └── keyboard-shortcuts.ts       # (from src/config/keyboard-shortcuts.ts)
│   │
│   ├── services/
│   │   ├── database.ts                 # (from src/services/database.ts)
│   │   │                               # Raw Tauri SQLite driver — no hooks, no React
│   │   ├── settings-store.ts           # (from src/services/settings-store.ts)
│   │   │                               # LazyStore wrapper for settings.json
│   │   ├── customization-storage.ts   # (from src/services/customization-storage.ts)
│   │   │                               # Reads/writes customization state to localStorage
│   │   └── customization-resolver.ts  # (from src/services/customization-resolver.ts)
│   │                                   # Merges theme + space overrides onto defaults
│   │
│   ├── store/
│   │   ├── index.ts                    # configureStore, AppStore, RootState, AppDispatch
│   │   │                               # + persistence middleware
│   │   ├── hooks.ts                    # useAppDispatch / useAppSelector
│   │   ├── selectors.ts                # All shared memoized selectors
│   │   ├── app-api.ts                  # (from src/store/api/app-api.ts) RTK Query API
│   │   │                               # All workspace/node/layout/keybinding endpoints
│   │   ├── slices/
│   │   │   ├── ui-slice.ts             # themePreference, activeSpaceId, activeFileId
│   │   │   └── customization-slice.ts  # Font/size overrides keyed by scope
│   │   └── hooks/
│   │       ├── use-filesystem-store.ts # (from src/store/hooks/use-filesystem-store.ts)
│   │       │                           # Wraps all RTK Query space/node mutations
│   │       └── use-layout-store.ts     # (from src/store/hooks/use-layout-store.ts)
│   │                                   # Wraps RTK Query layout endpoints
│   │
│   ├── theme/
│   │   ├── theme.ts                    # (from src/store/theme.ts)
│   │   │                               # ThemePreference, resolveTheme, applyResolvedTheme
│   │   └── use-theme-store.ts          # (from src/store/hooks/use-theme-store.ts)
│   │                                   # useThemeStore, useThemeBootstrap
│   │
│   ├── events/
│   │   └── app-events.ts               # (from src/lib/app-events.ts)
│   │                                   # APP_EVENTS, dispatchAppEvent,
│   │                                   # subscribeToAppEvent, useAppEvent
│   │
│   ├── types/
│   │   ├── layout.ts                   # Layout, SidebarPosition, LAYOUT_OPTIONS
│   │   ├── sidebar.ts                  # Node, SidebarProps, TreeItemProps
│   │   └── customization.ts            # CustomizationScope, CustomizationProperty, etc.
│   │
│   ├── utils/
│   │   ├── last-opened.ts              # (from src/utils/last-opened.ts)
│   │   │                               # Knows about spaceIds — app-specific
│   │   ├── invoke.ts                   # (from src/utils/invoke.ts)
│   │   │                               # Typed Tauri invoke map — app-specific
│   │   ├── file-tree.ts                # (from src/lib/file-tree.ts)
│   │   │                               # findFirstFileId, findNodeById — tree traversal
│   │   ├── space-selection.ts          # (from src/lib/space-selection.ts)
│   │   │                               # resolveInitialSpaceId — pure, app-specific
│   │   ├── web-import.ts              # (from src/utils/web-import.ts)
│   │   └── print.ts                   # (from src/utils/print.ts)
│   │
│   └── painter/
│       ├── README.md                   # Documents the contract before implementation
│       └── index.ts                    # export class Painter { ... }  — stub for now
│
│   ╔══════════════════════════════════════════════════════════════╗
│   ║  LIB  —  Neutral helpers. No app knowledge.                ║
│   ║  These could be extracted to an npm package unchanged.     ║
│   ║  No feature affiliation, no domain types, no Tauri.        ║
│   ╚══════════════════════════════════════════════════════════════╝
│
├── lib/
│   ├── utils.ts                        # cn(), clsx helpers (from src/lib/utils.ts)
│   ├── use-mobile.ts                   # (from src/hooks/use-mobile.ts)
│   └── use-custom-scrollbar.ts         # (from src/hooks/use-custom-scrollbar.ts)
│
│   ╔══════════════════════════════════════════════════════════════╗
│   ║  UI  —  Design system. Components + tokens only.           ║
│   ║  Zero hooks. Zero business logic. Zero app knowledge.      ║
│   ╚══════════════════════════════════════════════════════════════╝
│
├── ui/
│   ├── primitives/                     # Radix-based unstyled primitives
│   │   ├── button.tsx
│   │   ├── button-group.tsx
│   │   ├── input.tsx
│   │   ├── input-group.tsx
│   │   ├── textarea.tsx
│   │   ├── modal.tsx
│   │   ├── dialog.tsx
│   │   ├── popover.tsx
│   │   ├── tooltip.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── context-menu.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── slider.tsx
│   │   ├── skeleton.tsx
│   │   ├── tab-switcher.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── animated-icon.tsx
│   │   ├── ripple.tsx
│   │   └── scrollable-container.tsx    # (from src/components/common/)
│   │
│   ├── sidebar/                        # Sidebar shell primitives
│   │   ├── sidebar-provider.tsx
│   │   ├── sidebar-shell.tsx
│   │   ├── sidebar-primitives.tsx
│   │   └── sidebar.tsx
│   │
│   ├── tokens/                         # CSS design tokens (from src/styles/tokens/)
│   │   ├── unfold-primitives.css
│   │   ├── semantic-dark.css
│   │   ├── semantic-light.css
│   │   └── theme-mapping.css
│   │
│   └── index.ts                        # Barrel — re-exports all ui/ primitives
│
│   ╔══════════════════════════════════════════════════════════════╗
│   ║  COMPONENTS  —  Shared composed components + layouts.      ║
│   ║  Follows docmost: layouts/ lives here, not in features.    ║
│   ╚══════════════════════════════════════════════════════════════╝
│
├── components/
│   └── layouts/
│       └── global/
│           └── editor-layout.tsx       # (from src/layout/editor-layout.tsx)
│                                       # Route wrapper used as <Route element={<EditorLayout/>}>
│                                       # Contains Toolbar, Sidebar, SidebarInset, SearchBar
│                                       # and the USER_PRIMITIVE_MAP customization injection
│
│   ╔══════════════════════════════════════════════════════════════╗
│   ║  PAGES  —  One file per route. Thin shells only.           ║
│   ║  Composes feature components. Handles route params.        ║
│   ║  No logic that belongs in a feature lives here.            ║
│   ╚══════════════════════════════════════════════════════════════╝
│
├── pages/
│   ├── index-page.tsx                  # (from src/pages/index-page.tsx)
│   └── empty-state.tsx                 # (from src/pages/empty-state.tsx)
│
│   ╔══════════════════════════════════════════════════════════════╗
│   ║  FEATURES  —  Vertical slices. Each owns its world.        ║
│   ╚══════════════════════════════════════════════════════════════╝
│
├── features/
│   │
│   ├── editor/                         # Promoted from src/components/editor/
│   │   ├── components/
│   │   │   ├── breadcrumbs/            # (from src/components/breadcrumbs/)
│   │   │   │   ├── breadcrumb-item-link.tsx
│   │   │   │   ├── breadcrumb-overflow-menu.tsx
│   │   │   │   ├── breadcrumb-shell.tsx
│   │   │   │   ├── breadcrumb-types.ts
│   │   │   │   ├── breadcrumbs.tsx
│   │   │   │   ├── collapsed-breadcrumb-path.tsx
│   │   │   │   └── expanded-breadcrumb-path.tsx
│   │   │   ├── bubble-menu/
│   │   │   │   ├── atoms/
│   │   │   │   │   ├── bubble-separator.tsx
│   │   │   │   │   ├── color-swatch-button.tsx
│   │   │   │   │   ├── color-swatch-grid.tsx
│   │   │   │   │   └── format-toolbar-button.tsx
│   │   │   │   ├── bubble-menu.tsx
│   │   │   │   ├── color-selector.tsx
│   │   │   │   ├── link-selector.tsx
│   │   │   │   ├── node-selector.tsx
│   │   │   │   └── text-alignment-selector.tsx
│   │   │   ├── link/
│   │   │   │   ├── link-editor-panel.tsx
│   │   │   │   ├── use-link-editor-state.tsx
│   │   │   │   └── types.ts
│   │   │   ├── slash-menu/
│   │   │   │   └── types.ts
│   │   │   ├── drag-handle-button.tsx
│   │   │   ├── global-selection-highlighter.tsx  # (from src/components/common/)
│   │   │   ├── image-node-view.tsx
│   │   │   └── table-view.tsx
│   │   │
│   │   ├── extensions/
│   │   │   ├── helpers/
│   │   │   │   ├── clone-element.ts
│   │   │   │   ├── command-list-item.tsx
│   │   │   │   ├── command-list-view.tsx
│   │   │   │   ├── drag-handle-plugin.ts
│   │   │   │   ├── drag-handler.ts
│   │   │   │   ├── find-next-element-from-cursor.ts
│   │   │   │   ├── get-computed-style.ts
│   │   │   │   ├── get-inner-coords.ts
│   │   │   │   ├── get-outer-node.ts
│   │   │   │   ├── menu-items.ts
│   │   │   │   ├── remove-node.ts
│   │   │   │   └── render-items.ts
│   │   │   ├── custom-keymap.ts
│   │   │   ├── document-title.ts
│   │   │   ├── document.tsx
│   │   │   ├── drag-handle.tsx
│   │   │   ├── heading.tsx
│   │   │   ├── image.ts
│   │   │   ├── image-paste-handler.ts
│   │   │   ├── paste-handler.ts
│   │   │   ├── search-and-replace.ts
│   │   │   ├── slash-command.ts
│   │   │   └── starterkit.ts
│   │   │
│   │   ├── hooks/
│   │   │   └── use-editor-registry.ts  # (from src/store/hooks/use-editor-registry.ts)
│   │   │
│   │   ├── utils/
│   │   │   └── tiptap-utils.ts         # (from src/lib/tiptap-utils.ts)
│   │   │
│   │   ├── styles/
│   │   │   ├── block-spacing.css
│   │   │   ├── drag-handle.css
│   │   │   ├── extension-styles.tsx
│   │   │   ├── image-node.css
│   │   │   ├── page-editor.css
│   │   │   ├── search-and-replace.css
│   │   │   ├── table.css
│   │   │   └── title-editor.css
│   │   │
│   │   ├── editor-skeleton.tsx
│   │   ├── full-page-editor.tsx
│   │   ├── page-editor.tsx
│   │   └── title-editor.tsx
│   │
│   ├── sidebar/
│   │   ├── components/
│   │   │   ├── sidebar.tsx
│   │   │   ├── sidebar-tree-nodes.tsx
│   │   │   ├── create-space-modal.tsx
│   │   │   └── space-switcher-menu.tsx
│   │   ├── hooks/
│   │   │   ├── use-global-sidebar-shortcuts.ts  # (from src/hooks/)
│   │   │   └── use-sidebar-context-menu.ts      # (from src/hooks/)
│   │   └── utils/
│   │       ├── recently-created-node.ts
│   │       └── motion.ts                        # (from src/lib/motion.ts)
│   │                                            # Sidebar animation constants
│   │
│   ├── toolbar/
│   │   ├── components/
│   │   │   ├── toolbar.tsx
│   │   │   └── settings-modal.tsx
│   │   └── hooks/
│   │       ├── use-export-actions.ts
│   │       ├── use-import-actions.ts
│   │       └── use-relative-edited-time.ts
│   │
│   ├── search/
│   │   └── components/
│   │       ├── search-bar.tsx
│   │       ├── search-input-row.tsx
│   │       └── search-replace-row.tsx
│   │
│   ├── settings/
│   │   ├── components/
│   │   │   ├── settings-page.tsx
│   │   │   ├── customizability-section.tsx
│   │   │   ├── customization-empty-state.tsx
│   │   │   ├── editor-preview.tsx
│   │   │   ├── layout-settings.tsx
│   │   │   ├── row-reset-button.tsx
│   │   │   ├── size-slider-chip.tsx
│   │   │   ├── typography-preview-document.tsx
│   │   │   └── typography-row.tsx
│   │   ├── constants/
│   │   │   └── typography-rows.ts
│   │   ├── controls/
│   │   │   └── font-picker.tsx
│   │   └── hooks/
│   │       ├── use-customization-draft.ts
│   │       └── use-system-fonts.ts
│   │

│
│   ╔═══════════════════════════════════════════════════════╗
│   ║  STYLES  —  Global CSS entry only.                   ║
│   ║  Tokens live in ui/tokens/.                          ║
│   ╚═══════════════════════════════════════════════════════╝
│
└── styles/
    └── tailwind.css              # @import for tokens, global resets
```

---

## 4. The Four-Layer Rule

Every file in the project belongs to exactly one layer. The dependency arrow
only points downward — a lower layer never imports from a higher one.

```
pages/ + components/layouts/       ← composes features
         ↓
features/                          ← uses core, ui, lib
         ↓
core/ + ui/ + lib/                 ← no app imports above this line
```

Cross-feature imports (e.g. `features/sidebar` importing from
`features/editor`) are a code smell. If two features need the same thing, it
moves to `core/`.

---

## 5. The `painter/` Seam

`core/painter/` is created now as a stub so the pattern is committed to.

When the time comes, `Painter` will be a singleton class that:

- Subscribes to the Redux store via `store.subscribe()`
- Receives style mutation events (font change, accent color, radius, etc.)
- Applies them as CSS custom-property writes to `document.documentElement`
- Replaces the `USER_PRIMITIVE_MAP` + `customizationStyles` inline-style
  injection currently in `components/layouts/global/editor-layout.tsx`

```
core/painter/
├── README.md    # Documents the contract. Read before implementing.
└── index.ts     # export class Painter { apply(...) {} }  ← no-op stub
```

The `USER_PRIMITIVE_MAP` block in `editor-layout.tsx` stays exactly as-is
until `Painter` is ready to absorb it. **No behavior changes during this
restructure.**

---

## 6. Type-Safe Configuration with Zod

Instead of Atom's JSON schema approach, we use **Zod for type-safe schema
definition**. Zod serves as the single source of truth for both TypeScript
types AND runtime validation, with support for constraints (min/max), 
descriptions, and error messages.

### The Pattern: Zod-First

Define the schema in Zod, infer the TypeScript type from it:

```typescript
// core/types/style-config.ts
import { z } from 'zod';

const FontConfigSchema = z.object({
  fontFamily: z.string().describe('Font family name'),
  fontSize: z.number()
    .min(8, 'Minimum 8px')
    .max(48, 'Maximum 48px')
    .describe('Font size in pixels'),
});

const StyleConfigSchema = z.object({
  editor: FontConfigSchema,
  title: FontConfigSchema.extend({
    fontSize: z.number().min(8).max(96),  // title can go larger
  }),
  code: FontConfigSchema,
  h1: FontConfigSchema,
  h2: FontConfigSchema,
  h3: FontConfigSchema,
});

// TypeScript type is derived from the schema
export type StyleConfig = z.infer<typeof StyleConfigSchema>;
export type FontConfig = z.infer<typeof FontConfigSchema>;

// Use this at storage boundaries (loading from disk, imports, etc.)
export function validateStyleConfig(data: unknown): StyleConfig {
  return StyleConfigSchema.parse(data);
}
```

### Why Zod Over Plain TypeScript

| Concern | Plain TS | Zod-First |
|---|---|---|
| **Type safety** | ✓ Yes | ✓ Yes, same |
| **Runtime validation** | ✗ No | ✓ Full validation |
| **Min/max constraints** | ✗ JSDoc only | ✓ Enforced |
| **Error messages** | N/A | ✓ Custom messages |
| **Descriptions for UI** | ✗ JSDoc only | ✓ Built-in |
| **Single source of truth** | ✗ Types + JSDoc | ✓ Schema only |

### Adding a New Customizable Property

1. **Extend the schema** — `core/types/style-config.ts`:
   ```typescript
   const StyleConfigSchema = z.object({
     // ... existing fields
     spacing: z.object({
       unit: z.number().min(4).max(32),
     }),
   });
   ```

2. **Update defaults** — `core/config/customization-defaults.ts`:
   ```typescript
   export const STYLE_DEFAULTS: StyleConfig = {
     // ... existing
     spacing: { unit: 8 },
   };
   ```

3. **Add CSS-var mapping** — `components/layouts/global/editor-layout.tsx`:
   ```typescript
   const USER_PRIMITIVE_MAP: Array<[CustomizationPropertyKey, string]> = [
     // ... existing
     ['spacing.unit', '--unfold-spacing'],
   ];
   ```

4. **Done.** Full validation, type-checking, and IDE support automatically.

### Storage & Hydration

When loading customization from disk or localStorage, always validate:

```typescript
// core/services/customization-storage.ts
export function loadCustomizationState(): CustomizationState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw);
    
    // Validate against schema to catch corrupted/stale data
    const validated = StyleConfigSchema.partial().parse(parsed);
    return validated;
  } catch (error) {
    console.warn('Invalid customization, using defaults', error);
    return {};
  }
}
```

### Future: Plugin System

If you add a plugin system, Zod scales naturally:

```typescript
// Plugins provide config with open-ended keys at runtime
const pluginConfigSchema = z.record(z.unknown());

// Built-in config stays fully typed
const builtInConfigSchema = StyleConfigSchema;

// Plugins validated at registration time, built-in at compile time
```

---

## 8. Feature Anatomy — Standard Shape

Every feature follows this shape. Omit folders the feature does not need.
Never add folders just to have them.

```
features/<name>/
├── components/    # React components — only rendered inside this feature
├── hooks/         # Custom hooks — only used inside this feature
├── atoms/         # Module-level state singletons or jotai atoms
├── types/         # Types local to this feature (not shared → not in core/)
├── services/      # Pure async logic — no hooks, no React
├── utils/         # Pure utility functions local to this feature — no React, no async
├── styles/        # CSS files scoped to this feature
└── constants/     # String/number constants
```

`lib/` is not a valid folder name inside a feature. `lib/` has one meaning in
this codebase: `src/lib/` — neutral, app-agnostic helpers that could be
extracted to an npm package unchanged. Feature utilities are app-specific by definition,
so they use `utils/` instead.

---

## 7. Adding Zod to the Project

Install Zod as a dev dependency (or regular dependency if you validate at runtime):

```bash
npm install zod
```

Then in `tsconfig.json`, make sure `strict: true` is enabled:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

Zod's validation happens at **storage boundaries**:

- Loading customization from disk → validate against schema
- Importing user data → validate against schema
- Everything else inside the app → use the TypeScript type directly (already validated)

This keeps runtime overhead minimal while maintaining full type safety.

---

## 9. Shared Component Policy

| Old path | New home | Reason |
|---|---|---|
| `components/common/delete-confirmation-modal.tsx` | Inline in the owning feature | Business concept |
| `components/common/global-selection-highlighter.tsx` | `features/editor/components/` | Editor concern |
| `components/common/scrollable-container.tsx` | `ui/primitives/` | Pure layout primitive |
| `components/skeletons/workspace-skeletjson.tsx` | `pages/` | Route-level loading UI |

Rule: if a component renders a business concept (nodes, spaces, files) it
belongs in a feature. If it renders a pure layout or interaction primitive it
belongs in `ui/`.

---

## 10. State Architecture — Unchanged

The Redux + RTK Query setup does not change internally. Slices, `appApi`, and
the persistence middleware all move to `core/store/` but their logic is
untouched. The only change is import paths.

```
Before:  import { store } from '@/store'
After:   import { store } from '@/core/store'
```

---

## 11. Path Aliases

```jsonc
// tsconfig.json paths  (all resolve from src/)
{
  "@/*":         ["src/*"],
  "@core/*":     ["src/core/*"],
  "@ui/*":       ["src/ui/*"],
  "@features/*": ["src/features/*"]
}
```

`lib/`, `pages/`, and `components/` are reachable via the existing `@/*` alias.
No dedicated alias needed for them — they are shallow enough.

---

## 12. Migration Checklist

Ordered by dependency depth — innermost first, entry-points last.
Each step must compile (`tsc --noEmit`) before the next begins.

### Core
- [ ] Create `src/core/` skeleton
- [ ] Move `src/config/` → `src/core/config/`
- [ ] Move `src/types/` → `src/core/types/`
- [ ] Move `src/services/database.ts` → `src/core/services/database.ts`
- [ ] Move `src/services/settings-store.ts` → `src/core/services/settings-store.ts`
- [ ] Move `src/services/customization-storage.ts` → `src/core/services/customization-storage.ts`
- [ ] Move `src/store/theme.ts` → `src/core/theme/theme.ts`
- [ ] Move `src/store/hooks/use-theme-store.ts` → `src/core/theme/use-theme-store.ts`
- [ ] Move `src/store/` → `src/core/store/` (update all internal imports)
- [ ] Move `src/lib/app-events.ts` → `src/core/events/app-events.ts`
- [ ] Move `src/utils/last-opened.ts` → `src/core/utils/last-opened.ts`
- [ ] Move `src/utils/invoke.ts` → `src/core/utils/invoke.ts`
- [ ] Move `src/utils/web-import.ts` → `src/core/utils/web-import.ts`
- [ ] Move `src/utils/print.ts` → `src/core/utils/print.ts`
- [ ] Move `src/lib/file-tree.ts` → `src/core/utils/file-tree.ts`
- [ ] Move `src/lib/space-selection.ts` → `src/core/utils/space-selection.ts`
- [ ] Move `src/services/customization-resolver.ts` → `src/core/services/customization-resolver.ts`
- [ ] Move `src/store/hooks/use-filesystem-store.ts` → `src/core/store/hooks/use-filesystem-store.ts`
- [ ] Move `src/store/hooks/use-layout-store.ts` → `src/core/store/hooks/use-layout-store.ts`
- [ ] Create `src/core/painter/README.md` + `src/core/painter/index.ts` (stub)

### Lib
- [ ] Move `src/lib/utils.ts` → `src/lib/utils.ts` (already correct name, update path)
- [ ] Move `src/hooks/use-mobile.ts` → `src/lib/use-mobile.ts`
- [ ] Move `src/hooks/use-custom-scrollbar.ts` → `src/lib/use-custom-scrollbar.ts`

### UI
- [ ] Move `src/components/ui/` → `src/ui/primitives/` + `src/ui/sidebar/`
- [ ] Move `src/styles/tokens/` → `src/ui/tokens/`
- [ ] Move `src/components/common/scrollable-container.tsx` → `src/ui/primitives/`
- [ ] Create `src/ui/index.ts` barrel

### Components / Layouts
- [ ] Create `src/components/layouts/global/`
- [ ] Move `src/layout/editor-layout.tsx` → `src/components/layouts/global/editor-layout.tsx`

### Features
- [ ] Move `src/components/editor/` → `src/features/editor/`
- [ ] Move `src/lib/tiptap-utils.ts` → `src/features/editor/utils/tiptap-utils.ts`
- [ ] Move `src/store/hooks/use-editor-registry.ts` → `src/features/editor/hooks/`
- [ ] Move `src/components/breadcrumbs/` → `src/features/editor/components/breadcrumbs/`
- [ ] Move `src/components/common/global-selection-highlighter.tsx` → `src/features/editor/components/`
- [ ] Move `src/lib/motion.ts` → `src/features/sidebar/utils/motion.ts`
- [ ] Move `src/hooks/use-global-sidebar-shortcuts.ts` → `src/features/sidebar/hooks/`
- [ ] Move `src/hooks/use-sidebar-context-menu.ts` → `src/features/sidebar/hooks/`
- [ ] Move `src/hooks/use-layout-config.ts` → `src/features/sidebar/hooks/`
- [ ] Move `src/utils/customization-validation.ts` → `src/features/settings/utils/customization-validation.ts`
- [ ] All `src/features/*` existing folders — update their import paths only

### Pages
- [ ] Move `src/pages/` → keep as `src/pages/` (already correct)
- [ ] Move `src/components/skeletons/workspace-skeleton.tsx` → `src/pages/`
- [ ] Move `src/components/common/delete-confirmation-modal.tsx` → owning feature

### Entry Points
- [ ] Update `src/tsconfig.json` aliases
- [ ] Update `vite.config.ts` resolve aliases
- [ ] Update `src/router.tsx` import paths
- [ ] Update `src/app.tsx` import paths
- [ ] Update `src/main.tsx` import paths
- [ ] Run `tsc --noEmit` — zero errors
- [ ] Delete all now-empty directories

---

## 13. What Does NOT Change

- No component logic.
- No Redux slice logic.
- No RTK Query endpoint logic.
- No CSS token values.
- The `USER_PRIMITIVE_MAP` and `customizationStyles` block in `editor-layout.tsx`
  stays exactly as-is until `core/painter/` is ready.
- The Tauri backend is completely unaffected.
- `router.tsx` route structure is unchanged — only import paths update.