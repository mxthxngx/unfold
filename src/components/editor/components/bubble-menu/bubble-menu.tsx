import { FC, useEffect, useRef, useState } from "react";
import {
  isNodeSelection,
  useEditor,
  useEditorState,
} from "@tiptap/react";

import { BubbleMenu, BubbleMenuProps } from '@tiptap/react/menus'
import { BoldIcon, CodeIcon, ItalicIcon, StrikethroughIcon, UnderlineIcon } from "lucide-react";
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
  const [showBubbleMenu, setShowBubbleMenu] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const reopenTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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


    const handleNodeSelect = () => {
      setShowBubbleMenu(false);
      setIsNodeSelectorOpen(false);
      
      // Reopen the bubble menu after a brief delay
      if (reopenTimeoutRef.current) {
        clearTimeout(reopenTimeoutRef.current);
      }
      reopenTimeoutRef.current = setTimeout(() => {
        setShowBubbleMenu(true);
      }, 150);
    };

    useEffect(() => {
      return () => {
        if (reopenTimeoutRef.current) {
          clearTimeout(reopenTimeoutRef.current);
        }
      };
    }, []);

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


return (props.editor && showBubbleMenu) ?  (
    <BubbleMenu 
      editor={props.editor} 
      options={{placement:'top',offset:8,flip:true}}
      shouldShow={({ state }) => {
        const { selection } = state;
        const { empty } = selection;
        

        if (empty) {
          return false;
        }
        
        // Don't show bubble menu if an image node is selected
        if (isNodeSelection(selection)) {
          const node = selection.node;
          if (node?.type.name === 'image') {
            return false;
          }
        }
        
        return true;
      }}
    >
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
                onSelect={handleNodeSelect}
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
