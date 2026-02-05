# Color System Documentation

## Overview

This document describes the semantic color token system used throughout the Unfold application. The system is built on Tailwind CSS v4 with a comprehensive set of semantic tokens that support both light and dark modes out of the box.

## Design Principles

1. **Semantic Naming**: Colors are named by their purpose, not their appearance
2. **Mode-Agnostic**: All tokens automatically adapt to light/dark mode
3. **Component-Scoped**: Complex components have dedicated token namespaces
4. **Tailwind-First**: All tokens exposed as clean Tailwind utilities

## Token Categories

### Surface Colors (Backgrounds)

Use these for backgrounds, cards, and containers:

| Token | Tailwind Class | Dark Mode | Light Mode | Usage |
|-------|---------------|-----------|------------|-------|
| `--color-surface` | `bg-surface` | `#0d0d0d` | `#ffffff` | Main app background |
| `--color-surface-secondary` | `bg-surface-secondary` | `#0f0e11` | `#ffffff` | Cards, popovers |
| `--color-surface-tertiary` | `bg-surface-tertiary` | `#18181b` | `#f4f4f5` | Input fields, buttons |
| `--color-surface-elevated` | `bg-surface-elevated` | `#0f0f11` | `#f6f6f8` | Modals, dropdowns |
| `--color-surface-subtle` | `bg-surface-subtle` | `rgba(255,255,255,0.03)` | `rgba(0,0,0,0.02)` | Ghost buttons |

**Example Usage:**
```tsx
<div className="bg-surface-elevated border rounded-xl">
  <input className="bg-surface-tertiary" />
</div>
```

### Text Colors (Foreground)

Use these for text and icons:

| Token | Tailwind Class | Dark Mode | Light Mode | Usage |
|-------|---------------|-----------|------------|-------|
| `--color-foreground` | `text-foreground` | `#f7f2f2` | `#09090b` | Primary text |
| `--color-muted-foreground` | `text-muted-foreground` | `#8e8d8d` | `#71717a` | Secondary text |
| `--color-tertiary-foreground` | `text-tertiary-foreground` | `rgba(255,255,255,0.4)` | `rgba(0,0,0,0.4)` | Placeholder text |
| `--color-inverse-foreground` | `text-inverse-foreground` | `#09090b` | `#f7f2f2` | Text on inverted backgrounds |

**Example Usage:**
```tsx
<h1 className="text-foreground">Heading</h1>
<p className="text-muted-foreground">Description</p>
<input placeholder="..." className="placeholder:text-tertiary-foreground" />
```

### Brand Colors

Use these for primary actions and brand elements:

| Token | Tailwind Class | Value | Usage |
|-------|---------------|-------|-------|
| `--color-brand` | `bg-brand`, `text-brand`, `border-brand` | `#442986` | Primary brand color |
| `--color-brand-secondary` | `bg-brand-secondary` | `#432986` | Secondary brand |
| `--color-brand-contrast` | `bg-brand-contrast` | `#5a3a9e` | Brighter brand variant |
| `--color-brand-muted` | `bg-brand-muted` | `rgba(68,41,134,0.2)` | Subtle brand tint |

**Example Usage:**
```tsx
<button className="bg-brand text-inverse-foreground">
  Primary Action
</button>
<div className="bg-brand-muted border-brand">
  Highlighted section
</div>
```

### Border Colors

Use these for borders and dividers:

| Token | Tailwind Class | Dark Mode | Light Mode | Usage |
|-------|---------------|-----------|------------|-------|
| `--color-border` | `border` | `#232323` | `#e4e4e7` | Default borders |
| `--color-border-subtle` | `border-subtle` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.06)` | Subtle dividers |
| `--color-border-strong` | `border-strong` | `rgba(255,255,255,0.15)` | `rgba(0,0,0,0.15)` | Focus rings, emphasized borders |

**Example Usage:**
```tsx
<div className="border rounded-lg">
  <div className="border-subtle border-t" />
</div>
<input className="border focus:border-strong" />
```

### Interactive States

Use these for hover, focus, and active states:

| Token | Tailwind Class | Dark Mode | Light Mode | Usage |
|-------|---------------|-----------|------------|-------|
| `--color-interactive` | `bg-interactive` | `#18181b` | `#f4f4f5` | Default interactive background |
| `--color-interactive-hover` | `bg-interactive-hover` | `#1f1f1f` | `#e9e9ee` | Hover state |
| `--color-interactive-active` | `bg-interactive-active` | `#252528` | `#dedfe6` | Active/pressed state |

### Component-Specific Colors

#### Buttons

| Token | Tailwind Class | Dark Value | Light Value | Usage |
|-------|---------------|------------|-------------|-------|
| `--button-error-text` | `text-button-error-text` | `#f87171` | `#dc2626` | Error button text |
| `--button-error-bg` | `bg-button-error-bg` | `rgba(239, 68, 68, 0.15)` | `rgba(239, 68, 68, 0.08)` | Error button background |
| `--button-error-border` | `border-button-error-border` | `rgba(239, 68, 68, 0.2)` | `rgba(239, 68, 68, 0.15)` | Error button border |
| `--button-error-hover-bg` | `hover:bg-button-error-hover-bg` | `rgba(239, 68, 68, 0.2)` | `rgba(239, 68, 68, 0.12)` | Error button hover bg |
| `--color-interactive-disabled` | `bg-interactive-disabled` | `rgba(255,255,255,0.03)` | `rgba(0,0,0,0.02)` | Disabled state |

**Example Usage:**
```tsx
<button className="bg-interactive hover:bg-interactive-hover active:bg-interactive-active">
  Button
</button>
```

### Feedback Colors

Use these for status messages and alerts:

| Token | Tailwind Class | Value | Usage |
|-------|---------------|-------|-------|
| `--color-error` | `bg-error`, `text-error` | `#dc2626` | Error states |
| `--color-warning` | `bg-warning`, `text-warning` | `#EAB308` | Warning states |
| `--color-success` | `bg-success`, `text-success` | `#22C55E` | Success states |
| `--color-info` | `bg-info`, `text-info` | `#3B82F6` | Info states |

**Example Usage:**
```tsx
<div className="bg-error/10 border-error text-error">
  Error message
</div>
```

### Selection & Highlight

Use these for selected text and highlighted elements:

| Token | Tailwind Class | Dark Mode | Light Mode | Usage |
|-------|---------------|-----------|------------|-------|
| `--color-selection` | `bg-selection` | `rgba(255,255,255,0.10)` | `rgba(0,0,0,0.06)` | Default selection |
| `--color-selection-active` | `bg-selection-active` | `rgba(255,255,255,0.15)` | `rgba(0,0,0,0.10)` | Active selection |

**Example Usage:**
```tsx
<div className="hover:bg-selection active:bg-selection-active">
  Selectable item
</div>
```

## Component-Specific Tokens

### Sidebar

| Token | Tailwind Class | Usage |
|-------|---------------|-------|
| `--color-sidebar-container-bg` | `bg-sidebar-container-bg` | Sidebar background |
| `--color-sidebar-container-border` | `border-sidebar-container-border` | Sidebar border |
| `--color-sidebar-foreground` | `text-sidebar-foreground` | Sidebar text |
| `--color-sidebar-foreground-active` | `text-sidebar-foreground-active` | Active item text |
| `--color-sidebar-item-hover-bg` | `bg-sidebar-item-hover-bg` | Item hover background |
| `--color-sidebar-item-active-bg` | `bg-sidebar-item-active-bg` | Active item background |

### Modal

| Token | Tailwind Class | Usage |
|-------|---------------|-------|
| `--color-modal-surface` | `bg-modal-surface` | Modal background |
| `--color-modal-border` | `border-modal-border` | Modal border |
| `--color-modal-foreground` | `text-modal-foreground` | Modal text |
| `--color-modal-action-bg` | `bg-modal-action-bg` | Action button background |
| `--color-modal-action-hover` | `bg-modal-action-hover` | Action button hover |

### Button

| Token | Tailwind Class | Usage |
|-------|---------------|-------|
| `--color-button-bg` | `bg-button-bg` | Button background |
| `--color-button-border` | `border-button-border` | Button border |
| `--color-button-hover` | `bg-button-hover` | Button hover state |
| `--color-button-foreground` | `text-button-foreground` | Button text |
| `--color-button-ghost` | `bg-button-ghost` | Ghost button background |

### Table

| Token | Tailwind Class | Usage |
|-------|---------------|-------|
| `--color-table-border` | `border-table-border` | Table borders |
| `--color-table-header` | `bg-table-header` | Table header background |
| `--color-table-row-hover` | `bg-table-row-hover` | Row hover state |
| `--color-table-cell-purple` | N/A (CSS only) | Purple cell background |
| `--color-table-cell-blue` | N/A (CSS only) | Blue cell background |
| `--color-table-cell-green` | N/A (CSS only) | Green cell background |

### Editor

| Token | Tailwind Class | Usage |
|-------|---------------|-------|
| `--color-editor-bubble-menu` | `bg-editor-bubble-menu` | Bubble menu background |
| `--color-editor-caret` | N/A (CSS only) | Editor caret color |
| `--color-editor-placeholder` | N/A (CSS only) | Editor placeholder |
| `--color-editor-text-{color}` | N/A (JavaScript) | Text color options |
| `--color-editor-highlight-{color}` | N/A (JavaScript) | Highlight color options |

**Editor color palette** (available for text and highlights):
- gray, brown, orange, yellow, green, blue, purple, pink, red

## Migration Guide

### From Hardcoded Colors

```tsx
// ❌ Before (hardcoded)
<div className="bg-[#0d0d0d] text-[#f7f2f2]">

// ✅ After (semantic)
<div className="bg-surface text-foreground">
```

### From Tailwind Color Classes

```tsx
// ❌ Before (Tailwind colors)
<div className="bg-zinc-900 text-zinc-400">

// ✅ After (semantic)
<div className="bg-surface text-muted-foreground">
```

### From `bg-[var(--...)]` Syntax

```tsx
// ❌ Before (verbose)
<div className="bg-[var(--color-bg-elevated)]">

// ✅ After (clean)
<div className="bg-surface-elevated">
```

## Common Patterns

### Card Component
```tsx
<div className="bg-surface-secondary border rounded-xl p-4">
  <h3 className="text-foreground">Title</h3>
  <p className="text-muted-foreground">Description</p>
</div>
```

### Form Input
```tsx
<input
  className="bg-surface-tertiary border placeholder:text-tertiary-foreground
             focus:border-strong focus:ring-ring/50"
  placeholder="Enter text..."
/>
```

### Interactive List Item
```tsx
<button className="text-foreground/85 hover:bg-selection hover:text-foreground
                   active:bg-selection-active">
  List item
</button>
```

### Modal Dialog
```tsx
<div className="bg-modal-surface border-modal-border rounded-xl">
  <h2 className="text-modal-foreground">Modal Title</h2>
  <button className="bg-modal-action-bg hover:bg-modal-action-hover">
    Action
  </button>
</div>
```

## Adding New Colors

When adding new colors to the system:

1. **Define in `:root`** (dark mode) in `src/App.css`
2. **Define in `.light`** (light mode override)
3. **Expose in `@theme inline`** to make available as Tailwind utility
4. **Document in this file** with usage examples
5. **Test in both modes** to ensure proper contrast

Example:
```css
/* In :root */
--color-my-new-token: #value;

/* In .light */
--color-my-new-token: #light-value;

/* In @theme inline */
--color-my-new-token: var(--color-my-new-token);
```

Then use as: `bg-my-new-token` or `text-my-new-token`

## JavaScript Usage

For colors that need to be set as inline styles in JavaScript (e.g., editor text colors), use the `var()` syntax:

```tsx
const TEXT_COLORS = [
  { name: "Gray", color: "var(--color-editor-text-gray)" },
  { name: "Blue", color: "var(--color-editor-text-blue)" },
];

// Later in the component:
<span style={{ color: selectedColor }}>Text</span>
```

## Accessibility

All color combinations in this system meet WCAG AA standards:

- **Text contrast**: Minimum 4.5:1 ratio
- **UI component contrast**: Minimum 3:1 ratio
- **Focus indicators**: High contrast and visible in both modes

When adding new colors, verify contrast ratios using browser DevTools or online contrast checkers.

## File Structure

```
src/
├── App.css                    # Color system definitions
│   ├── :root                  # Dark mode tokens (default)
│   ├── .light                 # Light mode overrides
│   └── @theme inline          # Tailwind utility mappings
├── components/
│   └── [component]/           # Components use semantic tokens
└── docs/
    └── COLOR_SYSTEM.md        # This file
```

## Troubleshooting

### Unknown Utility Class Error

If you see `Cannot apply unknown utility class`, ensure the token is:
1. Defined in `:root` and `.light`
2. Mapped in `@theme inline`
3. Using correct naming (check for typos)

### Colors Not Updating in Light Mode

Verify the token has a light mode override in `.light` section.

### Variable Not Resolving

For JavaScript usage, make sure to use `var(--color-token-name)` syntax, not just `--color-token-name`.

## Resources

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

---

**Last Updated**: 2026-02-04
**Version**: 1.0.0
