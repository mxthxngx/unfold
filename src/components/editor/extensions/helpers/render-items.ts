import { ReactRenderer, useEditor } from "@tiptap/react";
import CommandList from "./command-list-view";
import tippy from "tippy.js";
import { slashMenuPluginKey } from "../slash-command";

const renderItems = () => {
  let component: ReactRenderer | null = null;
  let popup: any | null = null;
  let editorRef: ReturnType<typeof useEditor> | null = null;

  return {
    onStart: (props: {
      editor: ReturnType<typeof useEditor>;
      clientRect?: () => DOMRect | null;
    }) => {
      if (popup && !popup[0].state.isDestroyed) popup[0].destroy();
      if (component) component.destroy();
      popup = null;
      component = null;
      editorRef = props.editor;
      component = new ReactRenderer(CommandList, {
        props,
        editor: props.editor,
      });

      if (!props.clientRect) {
        return;
      }

      // @ts-ignore
      popup = tippy("body", {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
      });
    },
    onUpdate: (props: {
      editor: ReturnType<typeof useEditor>;
      clientRect?: () => DOMRect | null;
    }) => {
      editorRef = props.editor;
      component?.updateProps(props);

      if (!props.clientRect) {
        return;
      }
      popup &&
        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
    },
    onKeyDown: (props: { event: KeyboardEvent }) => {
      if (props.event.key === "Escape") {
        popup?.[0].hide();

        return true;
      }

      // @ts-ignore
      return component?.ref?.onKeyDown(props);
    },
    onExit: () => {
      const state = editorRef?.state;
      const slashState = state ? (slashMenuPluginKey.getState(state) as { active?: boolean } | undefined) : undefined;
      if (slashState?.active) {
        return;
      }
      if (popup && !popup[0].state.isDestroyed) {
        popup[0].destroy();
      }
      popup = null;
      if (component) {
        component.destroy();
      }
      component = null;
      editorRef = null;
    },
  };
};

export default renderItems;
