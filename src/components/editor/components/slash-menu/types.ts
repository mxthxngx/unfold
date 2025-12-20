import type { Editor } from '@tiptap/react';

export type CommandRange = {
  from: number;
  to: number;
};

export type CommandProps = {
  editor: Editor;
  range: CommandRange;
};

export type SlashMenuItem = {
  title: string;
  description: string;
  searchTerms?: string[];
  icon: React.ElementType;
  command: (props: CommandProps) => void;
};

export type SlashMenuGroupedItemsType = Record<string, SlashMenuItem[]>;
