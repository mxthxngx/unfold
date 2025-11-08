import React from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { LAYOUT_OPTIONS, SidebarPosition } from '@/types/layout';
import { cn } from '@/lib/tiptap-utils';

/**
 * Settings component to customize layout preferences.
 * This is modular and can be easily extended for additional settings
 * like fonts, heading sizes, etc.
 */
const LayoutSettings: React.FC = () => {
  const { layout, updateLayout, isLoading, error } = useLayout();

  const handleSidebarPositionChange = async (position: SidebarPosition) => {
    try {
      await updateLayout({ sidebar_position: position });
    } catch (err) {
      console.error('Failed to update sidebar position:', err);
    }
  };

  if (!layout) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Layout Settings</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Sidebar Position Setting */}
        <div className="space-y-3">
          <label className="block text-sm font-medium">
            {LAYOUT_OPTIONS.sidebar_position.label}
          </label>
          <div className="flex gap-2">
            {LAYOUT_OPTIONS.sidebar_position.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSidebarPositionChange(option.value)}
                disabled={isLoading}
                className={cn(
                  'flex-1 px-4 py-2 rounded text-sm font-medium transition-colors',
                  'border border-input',
                  layout.sidebar_position === option.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-accent hover:text-accent-foreground',
                  isLoading && 'opacity-50 cursor-not-allowed'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Placeholder for future settings */}
      <div className="text-xs text-muted-foreground border-t pt-4">
        More customization options (fonts, heading sizes, etc.) coming soon...
      </div>
    </div>
  );
};

export default LayoutSettings;
