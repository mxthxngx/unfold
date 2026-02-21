import { PluginKey } from "@tiptap/pm/state";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import { Extension } from "@tiptap/core";
import { getSuggestionItems } from "./helpers/menu-items";
import renderItems from "./helpers/render-items";

export const slashMenuPluginKey = new PluginKey('slash-command');

const Command = Extension.create({
    name: 'slash-command',
  
    addOptions() {
      return {
        suggestion: {
          char: '/',
          command: ({ editor, range, props }) => {
            props.command({ editor, range, props });
          },
        } as Partial<SuggestionOptions>,
      };
    },
  
    addProseMirrorPlugins() {
      return [
        Suggestion({
          pluginKey: slashMenuPluginKey,
          ...this.options.suggestion,
          editor: this.editor,
        }),
      ];
    },
  });
  
  const SlashCommand = Command.configure({
    suggestion: {
      items: getSuggestionItems,
      render: renderItems,
    },
  });
  
  export default SlashCommand;
  