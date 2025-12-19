import { FC, useRef, useState } from "react";
import {
  isNodeSelection,
  useEditor,
  useEditorState,
} from "@tiptap/react";

import { BubbleMenu, BubbleMenuProps } from '@tiptap/react/menus'
import { BoldIcon, CodeIcon, ItalicIcon, StrikethroughIcon, UnderlineIcon } from "lucide-react";
import { isTextSelected } from "../../utils/editor-extended";
import { editorClasses } from "../../styles/extension-styles";
import { Button } from "@/components/ui/button";
import { NodeSelector } from "./node-selector";
import { ButtonGroup } from "@/components/ui/button-group";
import { ColorSelector } from "./color-selector";
import { TextAlignmentSelector } from "./text-alignment-selector";
import { LinkSelector } from "./link-selector";
import { Tooltip, AppTooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface BubbleMenuItem {
    name: string;
    label: string;
    isActive: () => boolean;
    command: () => void;
    icon: React.ReactNode;
}
type EditorBubbleMenuProps = Omit<BubbleMenuProps, "children" | "editor"> & {
  editor: ReturnType<typeof useEditor>;
};
export const EditorBubbleMenu: FC<EditorBubbleMenuProps> = (props) => {

  const [isNodeSelectorOpen, setIsNodeSelectorOpen] = useState(false);
  const [isTextAlignmentSelectorOpen, setIsTextAlignmentOpen] = useState(false);
  const [isColorSelectorOpen, setIsColorSelectorOpen] = useState(false);
  const [isLinkSelectorOpen, setIsLinkSelectorOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

    const editorState = useEditorState({
        editor: props.editor,
        selector: (ctx) => {
            if(!props.editor)
            {
                return null;
            }
            return {
                isBold: ctx.editor.isActive("bold"),
                isItalic: ctx.editor.isActive("italic"),
                isUnderline: ctx.editor.isActive("underline"),
                isStrike: ctx.editor.isActive("strike"),
                isCode: ctx.editor.isActive("code"),
                isNodeSelection: isNodeSelection(ctx.editor.state.selection),
            };
        }
            });

    const items: BubbleMenuItem[] = [
        {
            name: "bold",
            label: "Bold",
            isActive: () => editorState?.isBold??false,
            command: () => props.editor.chain().focus().toggleBold().run(),
            icon: <BoldIcon />,
        },
        {
            name: "italic",
            label: "Italic",
            isActive: () => editorState?.isItalic??false,
            command: () => props.editor.chain().focus().toggleItalic().run(),
            icon: <ItalicIcon />,
        },
        {
            name: "underline",
            label: "Underline",
            isActive: () => editorState?.isUnderline??false,
            command: () => props.editor.chain().focus().toggleUnderline().run(),
            icon: <UnderlineIcon />,
        },
        {
            name: "strike",
            label: "Strikethrough",
            isActive: () => editorState?.isStrike??false,
            command: () => props.editor.chain().focus().toggleStrike().run(),
            icon: <StrikethroughIcon/>,
        },
        {
            name: "code",
            label: "Code",
            isActive: () => editorState?.isCode??false,
            command: () => props.editor.chain().focus().toggleCode().run(),
            icon: <CodeIcon />,
        }
    ];

    const bubbleMenuProps: EditorBubbleMenuProps = {
        ...props,
        shouldShow: ({ state, editor }) => {
            const {selection} = state;
            const {empty} = selection;
            console.log("selection:",selection);
      if (
        !editor.isEditable ||
        editor.isActive("image") ||
        empty ||
        isNodeSelection(selection)
      ) {
        console.log("isnodeselection:",isNodeSelection(selection), "isempty:",empty, "iseditable:",editor.isEditable, "isactiveimage:",editor.isActive("image"));
        return false;
      }
      console.log("istextselected:",isTextSelected(editor));
    return isTextSelected(editor);
    },
}

return props.editor ? (
    <BubbleMenu {...bubbleMenuProps}>
        <div ref={menuRef} className={editorClasses.bubbleMenu}>
            <NodeSelector 
                editor={props.editor} 
                isOpen={isNodeSelectorOpen} 
                setIsOpen={()=>{
                    setIsNodeSelectorOpen(!isNodeSelectorOpen);
                    setIsTextAlignmentOpen(false);
                    setIsColorSelectorOpen(false);
                    setIsLinkSelectorOpen(false);
                }}
                container={menuRef.current}
            />
            
            <div className="w-px h-6 bg-border mx-1" />
            
            <ButtonGroup>
                {items.map((item, index) => (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        data-active={item.isActive()}
                        onClick={(e)=>{
                          e.preventDefault();
                          item.command();
                        }}
                        className="h-8 w-8 p-0 rounded-lg"
                      >
                        {item.icon}
                      </Button>
                    </TooltipTrigger>
                    <AppTooltipContent label={item.label} />
                  </Tooltip>
                ))}
            </ButtonGroup>

            <div className="w-px h-6 bg-border mx-1" />
            
            <LinkSelector
                editor={props.editor}
                isOpen={isLinkSelectorOpen}
                setIsOpen={(value) => {
                    setIsLinkSelectorOpen(value);
                    setIsNodeSelectorOpen(false);
                    setIsTextAlignmentOpen(false);
                    setIsColorSelectorOpen(false);
                }}
            />

            <ColorSelector
                editor={props.editor}
                isOpen={isColorSelectorOpen}
                setIsOpen={() => {
                    setIsColorSelectorOpen(!isColorSelectorOpen);
                    setIsNodeSelectorOpen(false);
                    setIsTextAlignmentOpen(false);
                    setIsLinkSelectorOpen(false);
                }}
                container={menuRef.current}
            />

            <div className="w-px h-6 bg-border mx-1" />

            <TextAlignmentSelector
                editor={props.editor}
                isOpen={isTextAlignmentSelectorOpen}
                setIsOpen={() => {
                    setIsTextAlignmentOpen(!isTextAlignmentSelectorOpen);
                    setIsNodeSelectorOpen(false);
                    setIsColorSelectorOpen(false);
                    setIsLinkSelectorOpen(false);
                }}
                container={menuRef.current}
            />
        </div>
    </BubbleMenu>
) : null;
};
    
