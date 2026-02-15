import React, { useState } from 'react';
import LayoutSettings from '@/components/settings/layout-settings';
import { cn } from '@/lib/tiptap-utils';

interface SettingsPageProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'layout'>('layout');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] bg-background border border-border rounded-lg shadow-lg flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded',
              'hover:bg-accent transition-colors',
              'text-muted-foreground hover:text-foreground'
            )}
          >
            ✕
          </button>
        </div>

        <div className="flex border-b border-border px-6">
          <button
            onClick={() => setActiveTab('layout')}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'layout'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Layout
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'layout' && <LayoutSettings />}
        </div>

        <div className="border-t border-border px-6 py-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className={cn(
              'px-4 py-2 rounded text-sm font-medium',
              'bg-background border border-input',
              'hover:bg-accent transition-colors'
            )}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
