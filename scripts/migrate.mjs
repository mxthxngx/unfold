#!/usr/bin/env node
/**
 * Frontend Restructure Migration Script
 * Moves files to their new locations and rewrites all @/ import paths.
 * Run from the project root: node scripts/migrate.mjs
 * Safe to re-run — already-moved files are skipped.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, '../src');

// ─── Colour helpers ──────────────────────────────────────────────────────────
const g = (s) => `\x1b[32m${s}\x1b[0m`;
const y = (s) => `\x1b[33m${s}\x1b[0m`;
const r = (s) => `\x1b[31m${s}\x1b[0m`;
const b = (s) => `\x1b[34m${s}\x1b[0m`;

// ─── Move plan ────────────────────────────────────────────────────────────────
// [from, to]  — paths relative to src/
const MOVES = [
  // ── core/config ──────────────────────────────────────────────────────────
  ['config/customization-defaults.ts',   'core/config/customization-defaults.ts'],
  ['config/database.ts',                  'core/config/database.ts'],
  ['config/keyboard-shortcuts.ts',        'core/config/keyboard-shortcuts.ts'],

  // ── core/types ───────────────────────────────────────────────────────────
  ['types/customization.ts',              'core/types/customization.ts'],
  ['types/layout.ts',                     'core/types/layout.ts'],
  ['types/sidebar.ts',                    'core/types/sidebar.ts'],

  // ── core/services ────────────────────────────────────────────────────────
  ['services/database.ts',                'core/services/database.ts'],
  ['services/settings-store.ts',          'core/services/settings-store.ts'],
  ['services/customization-storage.ts',   'core/services/customization-storage.ts'],
  ['services/customization-resolver.ts',  'core/services/customization-resolver.ts'],

  // ── core/theme ───────────────────────────────────────────────────────────
  ['store/theme.ts',                      'core/theme/theme.ts'],
  ['store/hooks/use-theme-store.ts',      'core/theme/use-theme-store.ts'],

  // ── core/store ───────────────────────────────────────────────────────────
  ['store/index.ts',                      'core/store/index.ts'],
  ['store/hooks.ts',                      'core/store/hooks.ts'],
  ['store/selectors.ts',                  'core/store/selectors.ts'],
  ['store/api/app-api.ts',                'core/store/api/app-api.ts'],
  ['store/slices/customization-slice.ts', 'core/store/slices/customization-slice.ts'],
  ['store/slices/ui-slice.ts',            'core/store/slices/ui-slice.ts'],
  ['store/hooks/use-filesystem-store.ts', 'core/store/hooks/use-filesystem-store.ts'],
  ['store/hooks/use-layout-store.ts',     'core/store/hooks/use-layout-store.ts'],
  ['store/hooks/use-editor-registry.ts',  'core/store/hooks/use-editor-registry.ts'],

  // ── core/events ──────────────────────────────────────────────────────────
  ['lib/app-events.ts',                   'core/events/app-events.ts'],

  // ── core/utils ───────────────────────────────────────────────────────────
  ['utils/last-opened.ts',                'core/utils/last-opened.ts'],
  ['utils/invoke.ts',                     'core/utils/invoke.ts'],
  ['utils/web-import.ts',                 'core/utils/web-import.ts'],
  ['utils/print.ts',                      'core/utils/print.ts'],
  ['lib/file-tree.ts',                    'core/utils/file-tree.ts'],
  ['lib/space-selection.ts',              'core/utils/space-selection.ts'],

  // ── lib (neutral helpers) ────────────────────────────────────────────────
  // lib/utils.ts stays at lib/utils.ts — already correct
  ['hooks/use-mobile.ts',                 'lib/use-mobile.ts'],
  ['hooks/use-custom-scrollbar.ts',       'lib/use-custom-scrollbar.ts'],

  // ── hooks that stay but move to features ─────────────────────────────────
  ['hooks/use-global-sidebar-shortcuts.ts', 'features/sidebar/hooks/use-global-sidebar-shortcuts.ts'],
  ['hooks/use-sidebar-context-menu.ts',     'features/sidebar/hooks/use-sidebar-context-menu.ts'],
  ['hooks/use-layout-config.ts',            'features/sidebar/hooks/use-layout-config.ts'],
  ['hooks/use-settings.ts',                 'features/sidebar/hooks/use-settings.ts'],

  // ── lib/motion → features/sidebar/utils ─────────────────────────────────
  ['lib/motion.ts',                       'features/sidebar/utils/motion.ts'],

  // ── ui/primitives (from components/ui) ───────────────────────────────────
  ['components/ui/animated-icon.tsx',     'ui/primitives/animated-icon.tsx'],
  ['components/ui/breadcrumb.tsx',        'ui/primitives/breadcrumb.tsx'],
  ['components/ui/button-group.tsx',      'ui/primitives/button-group.tsx'],
  ['components/ui/button.tsx',            'ui/primitives/button.tsx'],
  ['components/ui/context-menu.tsx',      'ui/primitives/context-menu.tsx'],
  ['components/ui/dialog.tsx',            'ui/primitives/dialog.tsx'],
  ['components/ui/dropdown-menu.tsx',     'ui/primitives/dropdown-menu.tsx'],
  ['components/ui/input-group.tsx',       'ui/primitives/input-group.tsx'],
  ['components/ui/input.tsx',             'ui/primitives/input.tsx'],
  ['components/ui/modal.tsx',             'ui/primitives/modal.tsx'],
  ['components/ui/popover.tsx',           'ui/primitives/popover.tsx'],
  ['components/ui/ripple.tsx',            'ui/primitives/ripple.tsx'],
  ['components/ui/separator.tsx',         'ui/primitives/separator.tsx'],
  ['components/ui/sheet.tsx',             'ui/primitives/sheet.tsx'],
  ['components/ui/skeleton.tsx',          'ui/primitives/skeleton.tsx'],
  ['components/ui/slider.tsx',            'ui/primitives/slider.tsx'],
  ['components/ui/tab-switcher.tsx',      'ui/primitives/tab-switcher.tsx'],
  ['components/ui/textarea.tsx',          'ui/primitives/textarea.tsx'],
  ['components/ui/tooltip.tsx',           'ui/primitives/tooltip.tsx'],
  ['components/common/scrollable-container.tsx', 'ui/primitives/scrollable-container.tsx'],

  // ── ui/sidebar ────────────────────────────────────────────────────────────
  ['components/ui/sidebar-primitives.tsx', 'ui/sidebar/sidebar-primitives.tsx'],
  ['components/ui/sidebar-provider.tsx',   'ui/sidebar/sidebar-provider.tsx'],
  ['components/ui/sidebar-shell.tsx',      'ui/sidebar/sidebar-shell.tsx'],
  ['components/ui/sidebar.tsx',            'ui/sidebar/sidebar.tsx'],

  // ── ui/tokens ────────────────────────────────────────────────────────────
  ['styles/tokens/unfold-primitives.css',  'ui/tokens/unfold-primitives.css'],
  ['styles/tokens/semantic-dark.css',      'ui/tokens/semantic-dark.css'],
  ['styles/tokens/semantic-light.css',     'ui/tokens/semantic-light.css'],
  ['styles/tokens/theme-mapping.css',      'ui/tokens/theme-mapping.css'],

  // ── components/layouts ────────────────────────────────────────────────────
  ['layout/editor-layout.tsx',            'components/layouts/global/editor-layout.tsx'],

  // ── pages ────────────────────────────────────────────────────────────────
  ['components/skeletons/workspace-skeleton.tsx', 'pages/workspace-skeleton.tsx'],

  // ── features/editor (promoted from components/editor) ────────────────────
  ['components/editor/editor-skeleton.tsx',  'features/editor/editor-skeleton.tsx'],
  ['components/editor/full-page-editor.tsx', 'features/editor/full-page-editor.tsx'],
  ['components/editor/page-editor.tsx',      'features/editor/page-editor.tsx'],
  ['components/editor/title-editor.tsx',     'features/editor/title-editor.tsx'],

  ['components/editor/components/drag-handle-button.tsx',  'features/editor/components/drag-handle-button.tsx'],
  ['components/editor/components/image-node-view.tsx',     'features/editor/components/image-node-view.tsx'],
  ['components/editor/components/table-view.tsx',          'features/editor/components/table-view.tsx'],

  ['components/editor/components/bubble-menu/atoms/bubble-separator.tsx',   'features/editor/components/bubble-menu/atoms/bubble-separator.tsx'],
  ['components/editor/components/bubble-menu/atoms/color-swatch-button.tsx','features/editor/components/bubble-menu/atoms/color-swatch-button.tsx'],
  ['components/editor/components/bubble-menu/atoms/color-swatch-grid.tsx',  'features/editor/components/bubble-menu/atoms/color-swatch-grid.tsx'],
  ['components/editor/components/bubble-menu/atoms/format-toolbar-button.tsx','features/editor/components/bubble-menu/atoms/format-toolbar-button.tsx'],
  ['components/editor/components/bubble-menu/bubble-menu.tsx',             'features/editor/components/bubble-menu/bubble-menu.tsx'],
  ['components/editor/components/bubble-menu/color-selector.tsx',          'features/editor/components/bubble-menu/color-selector.tsx'],
  ['components/editor/components/bubble-menu/link-selector.tsx',           'features/editor/components/bubble-menu/link-selector.tsx'],
  ['components/editor/components/bubble-menu/node-selector.tsx',           'features/editor/components/bubble-menu/node-selector.tsx'],
  ['components/editor/components/bubble-menu/text-alignment-selector.tsx', 'features/editor/components/bubble-menu/text-alignment-selector.tsx'],

  ['components/editor/components/link/link-editor-panel.tsx',  'features/editor/components/link/link-editor-panel.tsx'],
  ['components/editor/components/link/types.ts',               'features/editor/components/link/types.ts'],
  ['components/editor/components/link/use-link-editor-state.tsx','features/editor/components/link/use-link-editor-state.tsx'],

  ['components/editor/components/slash-menu/types.ts', 'features/editor/components/slash-menu/types.ts'],

  ['components/editor/extensions/custom-keymap.ts',     'features/editor/extensions/custom-keymap.ts'],
  ['components/editor/extensions/document-title.ts',    'features/editor/extensions/document-title.ts'],
  ['components/editor/extensions/document.tsx',         'features/editor/extensions/document.tsx'],
  ['components/editor/extensions/drag-handle.tsx',      'features/editor/extensions/drag-handle.tsx'],
  ['components/editor/extensions/heading.tsx',           'features/editor/extensions/heading.tsx'],
  ['components/editor/extensions/image-paste-handler.ts','features/editor/extensions/image-paste-handler.ts'],
  ['components/editor/extensions/image.ts',              'features/editor/extensions/image.ts'],
  ['components/editor/extensions/paste-handler.ts',      'features/editor/extensions/paste-handler.ts'],
  ['components/editor/extensions/search-and-replace.ts', 'features/editor/extensions/search-and-replace.ts'],
  ['components/editor/extensions/slash-command.ts',      'features/editor/extensions/slash-command.ts'],
  ['components/editor/extensions/starterkit.ts',         'features/editor/extensions/starterkit.ts'],

  ['components/editor/extensions/helpers/clone-element.ts',             'features/editor/extensions/helpers/clone-element.ts'],
  ['components/editor/extensions/helpers/command-list-item.tsx',        'features/editor/extensions/helpers/command-list-item.tsx'],
  ['components/editor/extensions/helpers/command-list-view.tsx',        'features/editor/extensions/helpers/command-list-view.tsx'],
  ['components/editor/extensions/helpers/drag-handle-plugin.ts',        'features/editor/extensions/helpers/drag-handle-plugin.ts'],
  ['components/editor/extensions/helpers/drag-handler.ts',              'features/editor/extensions/helpers/drag-handler.ts'],
  ['components/editor/extensions/helpers/find-next-element-from-cursor.ts','features/editor/extensions/helpers/find-next-element-from-cursor.ts'],
  ['components/editor/extensions/helpers/get-computed-style.ts',        'features/editor/extensions/helpers/get-computed-style.ts'],
  ['components/editor/extensions/helpers/get-inner-coords.ts',          'features/editor/extensions/helpers/get-inner-coords.ts'],
  ['components/editor/extensions/helpers/get-outer-node.ts',            'features/editor/extensions/helpers/get-outer-node.ts'],
  ['components/editor/extensions/helpers/menu-items.ts',                'features/editor/extensions/helpers/menu-items.ts'],
  ['components/editor/extensions/helpers/remove-node.ts',               'features/editor/extensions/helpers/remove-node.ts'],
  ['components/editor/extensions/helpers/render-items.ts',              'features/editor/extensions/helpers/render-items.ts'],

  ['components/editor/styles/block-spacing.css',        'features/editor/styles/block-spacing.css'],
  ['components/editor/styles/drag-handle.css',          'features/editor/styles/drag-handle.css'],
  ['components/editor/styles/extension-styles.tsx',     'features/editor/styles/extension-styles.tsx'],
  ['components/editor/styles/image-node.css',           'features/editor/styles/image-node.css'],
  ['components/editor/styles/page-editor.css',          'features/editor/styles/page-editor.css'],
  ['components/editor/styles/search-and-replace.css',   'features/editor/styles/search-and-replace.css'],
  ['components/editor/styles/table.css',                'features/editor/styles/table.css'],
  ['components/editor/styles/title-editor.css',         'features/editor/styles/title-editor.css'],

  // ── features/editor — from lib/tiptap-utils ──────────────────────────────
  ['lib/tiptap-utils.ts',                 'features/editor/utils/tiptap-utils.ts'],

  // ── features/editor — breadcrumbs (from components/breadcrumbs) ──────────
  ['components/breadcrumbs/breadcrumb-item-link.tsx',     'features/editor/components/breadcrumbs/breadcrumb-item-link.tsx'],
  ['components/breadcrumbs/breadcrumb-overflow-menu.tsx', 'features/editor/components/breadcrumbs/breadcrumb-overflow-menu.tsx'],
  ['components/breadcrumbs/breadcrumb-shell.tsx',         'features/editor/components/breadcrumbs/breadcrumb-shell.tsx'],
  ['components/breadcrumbs/breadcrumb-types.ts',          'features/editor/components/breadcrumbs/breadcrumb-types.ts'],
  ['components/breadcrumbs/breadcrumbs.tsx',              'features/editor/components/breadcrumbs/breadcrumbs.tsx'],
  ['components/breadcrumbs/collapsed-breadcrumb-path.tsx','features/editor/components/breadcrumbs/collapsed-breadcrumb-path.tsx'],
  ['components/breadcrumbs/expanded-breadcrumb-path.tsx', 'features/editor/components/breadcrumbs/expanded-breadcrumb-path.tsx'],

  // ── features/editor — global-selection-highlighter ───────────────────────
  ['components/common/global-selection-highlighter.tsx', 'features/editor/components/global-selection-highlighter.tsx'],

  // ── features/editor — editor-registry hook ───────────────────────────────
  // (already handled above: store/hooks/use-editor-registry → core/store/hooks/use-editor-registry)

  // ── features/sidebar — lib → utils ───────────────────────────────────────
  ['features/sidebar/lib/recently-created-node.ts', 'features/sidebar/utils/recently-created-node.ts'],

  // ── features/settings — customization-validation ─────────────────────────
  ['utils/customization-validation.ts', 'features/settings/utils/customization-validation.ts'],

  // ── atoms + molecules stay as-is (absorbed, no new home assigned by plan)
  // They will still be reachable via @/ alias — only import paths need updating
  // for files that moved. We leave atoms/ and molecules/ in place.
];

// ─── Import rewrite map ───────────────────────────────────────────────────────
// Maps OLD @/... import path → NEW @/... import path.
// Keys must NOT have leading '@/' — just the path after it.
// These are sorted longest-first so more-specific prefixes win.
const IMPORT_REWRITES = [
  // store/hooks/use-editor-registry  →  core/store/hooks/use-editor-registry
  ['store/hooks/use-editor-registry',      'core/store/hooks/use-editor-registry'],
  // store/hooks/use-theme-store  →  core/theme/use-theme-store
  ['store/hooks/use-theme-store',          'core/theme/use-theme-store'],
  // store/hooks/use-filesystem-store  →  core/store/hooks/use-filesystem-store
  ['store/hooks/use-filesystem-store',     'core/store/hooks/use-filesystem-store'],
  // store/hooks/use-layout-store  →  core/store/hooks/use-layout-store
  ['store/hooks/use-layout-store',         'core/store/hooks/use-layout-store'],
  // store/api/app-api  →  core/store/api/app-api
  ['store/api/app-api',                    'core/store/api/app-api'],
  // store/slices/customization-slice  →  core/store/slices/customization-slice
  ['store/slices/customization-slice',     'core/store/slices/customization-slice'],
  // store/slices/ui-slice  →  core/store/slices/ui-slice
  ['store/slices/ui-slice',                'core/store/slices/ui-slice'],
  // store/theme  →  core/theme/theme
  ['store/theme',                          'core/theme/theme'],
  // store/hooks  →  core/store/hooks
  ['store/hooks',                          'core/store/hooks'],
  // store/selectors  →  core/store/selectors
  ['store/selectors',                      'core/store/selectors'],
  // store  →  core/store  (must come AFTER more-specific store/... rules)
  ['store',                                'core/store'],

  // config/...  →  core/config/...
  ['config/customization-defaults',        'core/config/customization-defaults'],
  ['config/database',                      'core/config/database'],
  ['config/keyboard-shortcuts',            'core/config/keyboard-shortcuts'],

  // types/...  →  core/types/...
  ['types/customization',                  'core/types/customization'],
  ['types/layout',                         'core/types/layout'],
  ['types/sidebar',                        'core/types/sidebar'],

  // services/...  →  core/services/...
  ['services/customization-resolver',      'core/services/customization-resolver'],
  ['services/customization-storage',       'core/services/customization-storage'],
  ['services/settings-store',              'core/services/settings-store'],
  ['services/database',                    'core/services/database'],

  // lib/app-events  →  core/events/app-events
  ['lib/app-events',                       'core/events/app-events'],
  // lib/file-tree  →  core/utils/file-tree
  ['lib/file-tree',                        'core/utils/file-tree'],
  // lib/space-selection  →  core/utils/space-selection
  ['lib/space-selection',                  'core/utils/space-selection'],
  // lib/tiptap-utils  →  features/editor/utils/tiptap-utils
  ['lib/tiptap-utils',                     'features/editor/utils/tiptap-utils'],
  // lib/motion  →  features/sidebar/utils/motion
  ['lib/motion',                           'features/sidebar/utils/motion'],
  // lib/utils  →  lib/utils  (unchanged — already correct)

  // utils/last-opened  →  core/utils/last-opened
  ['utils/last-opened',                    'core/utils/last-opened'],
  // utils/invoke  →  core/utils/invoke
  ['utils/invoke',                         'core/utils/invoke'],
  // utils/web-import  →  core/utils/web-import
  ['utils/web-import',                     'core/utils/web-import'],
  // utils/print  →  core/utils/print
  ['utils/print',                          'core/utils/print'],
  // utils/customization-validation  →  features/settings/utils/customization-validation
  ['utils/customization-validation',       'features/settings/utils/customization-validation'],

  // hooks/use-mobile  →  lib/use-mobile
  ['hooks/use-mobile',                     'lib/use-mobile'],
  // hooks/use-custom-scrollbar  →  lib/use-custom-scrollbar
  ['hooks/use-custom-scrollbar',           'lib/use-custom-scrollbar'],
  // hooks/use-global-sidebar-shortcuts  →  features/sidebar/hooks/use-global-sidebar-shortcuts
  ['hooks/use-global-sidebar-shortcuts',   'features/sidebar/hooks/use-global-sidebar-shortcuts'],
  // hooks/use-sidebar-context-menu  →  features/sidebar/hooks/use-sidebar-context-menu
  ['hooks/use-sidebar-context-menu',       'features/sidebar/hooks/use-sidebar-context-menu'],
  // hooks/use-layout-config  →  features/sidebar/hooks/use-layout-config
  ['hooks/use-layout-config',              'features/sidebar/hooks/use-layout-config'],
  // hooks/use-settings  →  features/sidebar/hooks/use-settings
  ['hooks/use-settings',                   'features/sidebar/hooks/use-settings'],

  // components/ui/sidebar-primitives  →  ui/sidebar/sidebar-primitives
  ['components/ui/sidebar-primitives',     'ui/sidebar/sidebar-primitives'],
  // components/ui/sidebar-provider  →  ui/sidebar/sidebar-provider
  ['components/ui/sidebar-provider',       'ui/sidebar/sidebar-provider'],
  // components/ui/sidebar-shell  →  ui/sidebar/sidebar-shell
  ['components/ui/sidebar-shell',          'ui/sidebar/sidebar-shell'],
  // components/ui/sidebar  →  ui/sidebar/sidebar
  ['components/ui/sidebar',               'ui/sidebar/sidebar'],

  // components/ui/...  →  ui/primitives/...
  ['components/ui/animated-icon',          'ui/primitives/animated-icon'],
  ['components/ui/breadcrumb',             'ui/primitives/breadcrumb'],
  ['components/ui/button-group',           'ui/primitives/button-group'],
  ['components/ui/button',                 'ui/primitives/button'],
  ['components/ui/context-menu',           'ui/primitives/context-menu'],
  ['components/ui/dialog',                 'ui/primitives/dialog'],
  ['components/ui/dropdown-menu',          'ui/primitives/dropdown-menu'],
  ['components/ui/input-group',            'ui/primitives/input-group'],
  ['components/ui/input',                  'ui/primitives/input'],
  ['components/ui/modal',                  'ui/primitives/modal'],
  ['components/ui/popover',                'ui/primitives/popover'],
  ['components/ui/ripple',                 'ui/primitives/ripple'],
  ['components/ui/separator',             'ui/primitives/separator'],
  ['components/ui/sheet',                  'ui/primitives/sheet'],
  ['components/ui/skeleton',               'ui/primitives/skeleton'],
  ['components/ui/slider',                 'ui/primitives/slider'],
  ['components/ui/tab-switcher',           'ui/primitives/tab-switcher'],
  ['components/ui/textarea',              'ui/primitives/textarea'],
  ['components/ui/tooltip',               'ui/primitives/tooltip'],

  // components/common/scrollable-container  →  ui/primitives/scrollable-container
  ['components/common/scrollable-container', 'ui/primitives/scrollable-container'],
  // components/common/global-selection-highlighter  →  features/editor/components/global-selection-highlighter
  ['components/common/global-selection-highlighter', 'features/editor/components/global-selection-highlighter'],
  // components/common/delete-confirmation-modal  →  stays (kept in place, no move)

  // components/breadcrumbs/...  →  features/editor/components/breadcrumbs/...
  ['components/breadcrumbs/breadcrumb-item-link',     'features/editor/components/breadcrumbs/breadcrumb-item-link'],
  ['components/breadcrumbs/breadcrumb-overflow-menu', 'features/editor/components/breadcrumbs/breadcrumb-overflow-menu'],
  ['components/breadcrumbs/breadcrumb-shell',         'features/editor/components/breadcrumbs/breadcrumb-shell'],
  ['components/breadcrumbs/breadcrumb-types',         'features/editor/components/breadcrumbs/breadcrumb-types'],
  ['components/breadcrumbs/breadcrumbs',              'features/editor/components/breadcrumbs/breadcrumbs'],
  ['components/breadcrumbs/collapsed-breadcrumb-path','features/editor/components/breadcrumbs/collapsed-breadcrumb-path'],
  ['components/breadcrumbs/expanded-breadcrumb-path', 'features/editor/components/breadcrumbs/expanded-breadcrumb-path'],

  // components/editor/...  →  features/editor/...
  ['components/editor/components/bubble-menu/atoms/bubble-separator',    'features/editor/components/bubble-menu/atoms/bubble-separator'],
  ['components/editor/components/bubble-menu/atoms/color-swatch-button', 'features/editor/components/bubble-menu/atoms/color-swatch-button'],
  ['components/editor/components/bubble-menu/atoms/color-swatch-grid',   'features/editor/components/bubble-menu/atoms/color-swatch-grid'],
  ['components/editor/components/bubble-menu/atoms/format-toolbar-button','features/editor/components/bubble-menu/atoms/format-toolbar-button'],
  ['components/editor/components/bubble-menu/bubble-menu',               'features/editor/components/bubble-menu/bubble-menu'],
  ['components/editor/components/bubble-menu/color-selector',            'features/editor/components/bubble-menu/color-selector'],
  ['components/editor/components/bubble-menu/link-selector',             'features/editor/components/bubble-menu/link-selector'],
  ['components/editor/components/bubble-menu/node-selector',             'features/editor/components/bubble-menu/node-selector'],
  ['components/editor/components/bubble-menu/text-alignment-selector',   'features/editor/components/bubble-menu/text-alignment-selector'],
  ['components/editor/components/link/link-editor-panel',  'features/editor/components/link/link-editor-panel'],
  ['components/editor/components/link/types',              'features/editor/components/link/types'],
  ['components/editor/components/link/use-link-editor-state','features/editor/components/link/use-link-editor-state'],
  ['components/editor/components/slash-menu/types',        'features/editor/components/slash-menu/types'],
  ['components/editor/components/drag-handle-button',      'features/editor/components/drag-handle-button'],
  ['components/editor/components/image-node-view',         'features/editor/components/image-node-view'],
  ['components/editor/components/table-view',              'features/editor/components/table-view'],
  ['components/editor/extensions/helpers/clone-element',              'features/editor/extensions/helpers/clone-element'],
  ['components/editor/extensions/helpers/command-list-item',          'features/editor/extensions/helpers/command-list-item'],
  ['components/editor/extensions/helpers/command-list-view',          'features/editor/extensions/helpers/command-list-view'],
  ['components/editor/extensions/helpers/drag-handle-plugin',         'features/editor/extensions/helpers/drag-handle-plugin'],
  ['components/editor/extensions/helpers/drag-handler',               'features/editor/extensions/helpers/drag-handler'],
  ['components/editor/extensions/helpers/find-next-element-from-cursor','features/editor/extensions/helpers/find-next-element-from-cursor'],
  ['components/editor/extensions/helpers/get-computed-style',         'features/editor/extensions/helpers/get-computed-style'],
  ['components/editor/extensions/helpers/get-inner-coords',           'features/editor/extensions/helpers/get-inner-coords'],
  ['components/editor/extensions/helpers/get-outer-node',             'features/editor/extensions/helpers/get-outer-node'],
  ['components/editor/extensions/helpers/menu-items',                 'features/editor/extensions/helpers/menu-items'],
  ['components/editor/extensions/helpers/remove-node',                'features/editor/extensions/helpers/remove-node'],
  ['components/editor/extensions/helpers/render-items',               'features/editor/extensions/helpers/render-items'],
  ['components/editor/extensions/custom-keymap',      'features/editor/extensions/custom-keymap'],
  ['components/editor/extensions/document-title',     'features/editor/extensions/document-title'],
  ['components/editor/extensions/document',           'features/editor/extensions/document'],
  ['components/editor/extensions/drag-handle',        'features/editor/extensions/drag-handle'],
  ['components/editor/extensions/heading',            'features/editor/extensions/heading'],
  ['components/editor/extensions/image-paste-handler','features/editor/extensions/image-paste-handler'],
  ['components/editor/extensions/image',              'features/editor/extensions/image'],
  ['components/editor/extensions/paste-handler',      'features/editor/extensions/paste-handler'],
  ['components/editor/extensions/search-and-replace', 'features/editor/extensions/search-and-replace'],
  ['components/editor/extensions/slash-command',      'features/editor/extensions/slash-command'],
  ['components/editor/extensions/starterkit',         'features/editor/extensions/starterkit'],
  ['components/editor/styles/extension-styles',       'features/editor/styles/extension-styles'],
  ['components/editor/editor-skeleton',               'features/editor/editor-skeleton'],
  ['components/editor/full-page-editor',              'features/editor/full-page-editor'],
  ['components/editor/page-editor',                   'features/editor/page-editor'],
  ['components/editor/title-editor',                  'features/editor/title-editor'],

  // components/skeletons/...  →  pages/...
  ['components/skeletons/workspace-skeleton', 'pages/workspace-skeleton'],

  // layout/...  →  components/layouts/global/...
  ['layout/editor-layout',                 'components/layouts/global/editor-layout'],

  // features/sidebar/lib/...  →  features/sidebar/utils/...
  ['features/sidebar/lib/recently-created-node', 'features/sidebar/utils/recently-created-node'],
];

// ─── CSS token import rewrites (for tailwind.css) ────────────────────────────
const CSS_REWRITES = [
  ['./tokens/', '../ui/tokens/'],
  ["'./tokens/", "'../ui/tokens/"],
  ['"./tokens/', '"../ui/tokens/'],
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function moveFile(fromRel, toRel) {
  const from = path.join(SRC, fromRel);
  const to   = path.join(SRC, toRel);

  if (!fs.existsSync(from)) {
    console.log(y(`  SKIP  (not found) ${fromRel}`));
    return false;
  }
  if (fs.existsSync(to) && from !== to) {
    console.log(y(`  SKIP  (dest exists) ${toRel}`));
    return false;
  }
  ensureDir(to);
  fs.renameSync(from, to);
  console.log(g(`  MOVE  ${fromRel}  →  ${toRel}`));
  return true;
}

/**
 * Rewrite all @/old/path imports inside a file to @/new/path.
 * Uses the IMPORT_REWRITES table (longest match wins, applied once per import).
 */
function rewriteImports(content) {
  // Match: from '@/...' or from "@/..."  (with optional trailing whitespace/semicolons)
  // Also matches: import('@/...') and require('@/...')
  return content.replace(
    /(['"])(@\/[^'"]+)\1/g,
    (match, quote, importPath) => {
      const inner = importPath.slice(2); // strip '@/'
      for (const [oldPrefix, newPrefix] of IMPORT_REWRITES) {
        // Match exactly: inner === oldPrefix  OR  inner starts with oldPrefix + '/'
        if (inner === oldPrefix || inner.startsWith(oldPrefix + '/')) {
          const rewritten = newPrefix + inner.slice(oldPrefix.length);
          return `${quote}@/${rewritten}${quote}`;
        }
      }
      return match; // unchanged
    }
  );
}

function processFile(filePath) {
  const ext = path.extname(filePath);
  const isSource = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext);
  const isCSS    = ext === '.css';

  if (!isSource && !isCSS) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let updated = content;

  if (isSource) {
    updated = rewriteImports(content);
  }

  if (isCSS && filePath.endsWith('tailwind.css')) {
    for (const [from, to] of CSS_REWRITES) {
      updated = updated.split(from).join(to);
    }
  }

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(b(`  PATCH ${filePath.replace(SRC + '/', '')}`));
  }
}

/**
 * Walk all .ts/.tsx/.css files in src/ and rewrite imports.
 */
function walkAndPatch(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkAndPatch(full);
    } else {
      processFile(full);
    }
  }
}

/**
 * Remove a directory if it is empty (recursively prune empty parents).
 */
function pruneEmpty(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir);
  if (entries.length === 0) {
    fs.rmdirSync(dir);
    console.log(y(`  RMDIR ${dir.replace(SRC + '/', '')}`));
    pruneEmpty(path.dirname(dir));
  }
}

// ─── Create stub files ────────────────────────────────────────────────────────
function createStubs() {
  // core/painter/README.md
  const painterReadme = path.join(SRC, 'core/painter/README.md');
  if (!fs.existsSync(painterReadme)) {
    ensureDir(painterReadme);
    fs.writeFileSync(painterReadme, `# core/painter

The \`Painter\` singleton will eventually replace the \`USER_PRIMITIVE_MAP\` +
\`customizationStyles\` inline-style injection in
\`components/layouts/global/editor-layout.tsx\`.

## Contract

\`\`\`ts
class Painter {
  /** Subscribe to the Redux store and apply CSS custom-property mutations. */
  apply(store: AppStore): void {}
}
\`\`\`

Do not implement until the customization architecture is stabilised.
`);
    console.log(g('  CREATE core/painter/README.md'));
  }

  // core/painter/index.ts
  const painterIndex = path.join(SRC, 'core/painter/index.ts');
  if (!fs.existsSync(painterIndex)) {
    fs.writeFileSync(painterIndex, `// Painter stub — see README.md before implementing.
export class Painter {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  apply(_store: unknown): void {}
}
`);
    console.log(g('  CREATE core/painter/index.ts'));
  }

  // ui/index.ts barrel
  const uiIndex = path.join(SRC, 'ui/index.ts');
  if (!fs.existsSync(uiIndex)) {
    ensureDir(uiIndex);
    const primitives = [
      'animated-icon', 'breadcrumb', 'button-group', 'button', 'context-menu',
      'dialog', 'dropdown-menu', 'input-group', 'input', 'modal', 'popover',
      'ripple', 'separator', 'sheet', 'skeleton', 'slider', 'tab-switcher',
      'textarea', 'tooltip', 'scrollable-container',
    ];
    const sidebarParts = ['sidebar-primitives', 'sidebar-provider', 'sidebar-shell', 'sidebar'];
    const lines = [
      '// Auto-generated barrel — re-exports all ui/ primitives and sidebar.',
      '',
      ...primitives.map(p => `export * from './primitives/${p}';`),
      '',
      ...sidebarParts.map(p => `export * from './sidebar/${p}';`),
    ];
    fs.writeFileSync(uiIndex, lines.join('\n') + '\n');
    console.log(g('  CREATE ui/index.ts'));
  }
}

// ─── Update tsconfig.json paths ───────────────────────────────────────────────
function updateTsConfig() {
  const tsconfigPath = path.resolve(__dirname, '../tsconfig.json');
  const raw = fs.readFileSync(tsconfigPath, 'utf8');
  const cfg = JSON.parse(raw);

  cfg.compilerOptions = cfg.compilerOptions || {};
  cfg.compilerOptions.paths = {
    '@/*':         ['./src/*'],
    '@core/*':     ['./src/core/*'],
    '@ui/*':       ['./src/ui/*'],
    '@features/*': ['./src/features/*'],
  };

  // Preserve strict: true
  cfg.compilerOptions.strict = true;

  const updated = JSON.stringify(cfg, null, 2) + '\n';
  if (updated !== raw) {
    fs.writeFileSync(tsconfigPath, updated, 'utf8');
    console.log(g('  PATCH tsconfig.json (added @core/*, @ui/*, @features/* aliases)'));
  }
}

// ─── Update vite.config.ts ────────────────────────────────────────────────────
function updateViteConfig() {
  const vitePath = path.resolve(__dirname, '../vite.config.ts');
  let content = fs.readFileSync(vitePath, 'utf8');

  const hasCore = content.includes("'@core'") || content.includes('"@core"') || content.includes('@core/*');
  if (hasCore) {
    console.log(y('  SKIP  vite.config.ts (aliases already present)'));
    return;
  }

  // Replace the alias block
  const oldAlias = `  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },`;

  const newAlias = `  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@features': path.resolve(__dirname, './src/features'),
    },
  },`;

  const updated = content.replace(oldAlias, newAlias);
  if (updated !== content) {
    fs.writeFileSync(vitePath, updated, 'utf8');
    console.log(g('  PATCH vite.config.ts (added @core, @ui, @features aliases)'));
  } else {
    console.log(y('  WARN  vite.config.ts alias block not matched — check manually'));
  }
}

// ─── Delete empty legacy directories ─────────────────────────────────────────
function cleanupDirs() {
  const toCheck = [
    'components/editor',
    'components/breadcrumbs',
    'components/common',
    'components/skeletons',
    'components/ui',
    'store/hooks',
    'store/api',
    'store/slices',
    'store',
    'services',
    'config',
    'types',
    'layout',
    'hooks',
    'lib',
    'utils',
  ];

  for (const rel of toCheck) {
    const full = path.join(SRC, rel);
    if (!fs.existsSync(full)) continue;
    const entries = fs.readdirSync(full, { recursive: true }).filter(e => {
      const ep = path.join(full, e);
      return fs.statSync(ep).isFile() && !ep.endsWith('.DS_Store');
    });
    if (entries.length === 0) {
      fs.rmSync(full, { recursive: true, force: true });
      console.log(y(`  RMDIR ${rel}/ (empty)`));
    } else {
      console.log(y(`  KEEP  ${rel}/ (${entries.length} file(s) remain)`));
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log(b('\n═══ Step 1: Move files ═══\n'));
for (const [from, to] of MOVES) {
  moveFile(from, to);
}

console.log(b('\n═══ Step 2: Create stubs & barrels ═══\n'));
createStubs();

console.log(b('\n═══ Step 3: Rewrite @/ imports across src/ ═══\n'));
walkAndPatch(SRC);

console.log(b('\n═══ Step 4: Update tsconfig.json ═══\n'));
updateTsConfig();

console.log(b('\n═══ Step 5: Update vite.config.ts ═══\n'));
updateViteConfig();

console.log(b('\n═══ Step 6: Prune empty legacy directories ═══\n'));
cleanupDirs();

console.log(g('\n✓ Migration complete. Run: pnpm typecheck\n'));