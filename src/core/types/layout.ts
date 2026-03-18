export type SidebarPosition = 'left' | 'right';

export interface Layout {
  sidebar_position?: SidebarPosition;
}

export const LAYOUT_OPTIONS = {
  sidebar_position: {
    label: 'Sidebar Position',
    options: [
      { value: 'left' as const, label: 'Left' },
      { value: 'right' as const, label: 'Right' },
    ],
  },
} as const;
