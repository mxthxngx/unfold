import {
  CommandProps,
  SlashMenuGroupedItemsType,
} from "@/components/editor/components/slash-menu/types";
import { TypeIcon, ListTodo, Heading1Icon, Heading2Icon, Heading3Icon, ListIcon, ListOrdered, TextQuote, BracesIcon, MinusIcon, TableIcon } from "lucide-react";

const getAvailableCommands = () => {
  const commands = [
    {
      title: "Text",
      description: "Just start typing with plain text.",
      searchTerms: ["p", "paragraph"],
      icon: TypeIcon,
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleNode("paragraph", "paragraph")
          .run();
      },
    },
    {
      title: "To-do list",
      description: "Track tasks with a to-do list",
      searchTerms: ["todo", "task", "list", "check", "checkbox"],
      icon: ListTodo,
      command: ({ editor, range }: CommandProps) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      title: "Heading 1",
      description: "Big section heading",
      searchTerms: ["title", "big", "large"],
      icon: Heading1Icon,
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 1 })
          .run();
      },
    },
    {
      title: "Heading 2",
      description: "Medium section heading",
      searchTerms: ["subtitle", "medium"],
      icon: Heading2Icon,
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 2 })
          .run();
      },
    },
    {
      title: "Heading 3",
      description: "Small section heading",
      searchTerms: ["subtitle", "small"],
      icon: Heading3Icon,
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 3 })
          .run();
      },
    },
    {
      title: "Bullet list",
      description: "Create a simple bullet list",
      searchTerms: ["unordered", "point", "list"],
      icon: ListIcon,
      command: ({ editor, range }: CommandProps) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: "Numbered list",
      description: "Create a list with numbering",
      searchTerms: ["numbered", "ordered", "list"],
      icon: ListOrdered,
      command: ({ editor, range }: CommandProps) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: "Quote",
      description: "Create block quote",
      searchTerms: ["blockquote", "quotes"],
      icon: TextQuote,
      command: ({ editor, range }: CommandProps) =>
        editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
      title: "Code",
      description: "Insert code snippet",
      searchTerms: ["codeblock"],
      icon: BracesIcon,
      command: ({ editor, range }: CommandProps) =>
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
      title: "Divider",
      description: "Insert horizontal rule divider",
      searchTerms: ["horizontal rule", "hr"],
      icon: MinusIcon,
      command: ({ editor, range }: CommandProps) =>
        editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
    {
      title: "Table",
      description: "Insert a table.",
      searchTerms: ["table", "rows", "columns"],
      icon: TableIcon,
      command: ({ editor, range }: CommandProps) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    },
  ];

  return commands;
};

export const getSuggestionItems = ({
  query,
}: {
  query: string;
}): SlashMenuGroupedItemsType => {
  const search = query.toLowerCase();
  const filteredGroups: SlashMenuGroupedItemsType = {};

  const fuzzyMatch = (query: string, target: string) => {
    let queryIndex = 0;
    target = target.toLowerCase();
    for (const char of target) {
      if (query[queryIndex] === char) queryIndex++;
      if (queryIndex === query.length) return true;
    }
    return false;
  };

  const availableCommands = getAvailableCommands();
  
  const filteredItems = availableCommands.filter((item) => {
    return (
      fuzzyMatch(search, item.title) ||
      item.description.toLowerCase().includes(search) ||
      (item.searchTerms &&
        item.searchTerms.some((term: string) => term.includes(search)))
    );
  });

  if (filteredItems.length) {
    filteredGroups["basic"] = filteredItems;
  }

  return filteredGroups;
};

export default getSuggestionItems;