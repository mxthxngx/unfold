import { Dispatch, FC, SetStateAction } from "react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, AppTooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export interface BubbleColorMenuItem {
  name: string;
  color: string;
}

interface ColorSelectorProps {
  editor: Editor | null;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  container?: HTMLElement | null;
}

const TEXT_COLORS: BubbleColorMenuItem[] = [
  { name: "Default", color: "" },
  { name: "Gray", color: "#A8A29E" },
  { name: "Brown", color: "#78716C" },
  { name: "Orange", color: "#F97316" },
  { name: "Yellow", color: "#EAB308" },
  { name: "Green", color: "#22C55E" },
  { name: "Blue", color: "#3B82F6" },
  { name: "Purple", color: "#A855F7" },
  { name: "Pink", color: "#EC4899" },
  { name: "Red", color: "#EF4444" },
];

const BACKGROUND_COLORS: BubbleColorMenuItem[] = [
  { name: "Default", color: "" },
  { name: "Gray", color: "#374151" },
  { name: "Brown", color: "#451a03" },
  { name: "Orange", color: "#7c2d12" },
  { name: "Yellow", color: "#713f12" },
  { name: "Green", color: "#14532d" },
  { name: "Blue", color: "#1e3a5f" },
  { name: "Purple", color: "#3b0764" },
  { name: "Pink", color: "#500724" },
  { name: "Red", color: "#7f1d1d" },
];

export const ColorSelector: FC<ColorSelectorProps> = ({
  editor,
  isOpen,
  setIsOpen,
}) => {

  const editorState = useEditorState({
    editor,
    selector: ctx => {
      if (!ctx.editor) {
        return null;
      }

      const activeColors: Record<string, boolean> = {};
      TEXT_COLORS.forEach(({ color }) => {
        activeColors[`text_${color}`] = ctx.editor!.isActive("textStyle", { color });
      });
      BACKGROUND_COLORS.forEach(({ color }) => {
        activeColors[`highlight_${color}`] = ctx.editor!.isActive("highlight", { color });
      });

      return activeColors;
    },
  });

  if (!editor || !editorState) {
    return null;
  }

  const activeTextColor = TEXT_COLORS.find(({ color }) =>
    editorState[`text_${color}`]
  );

  const activeHighlightColor = BACKGROUND_COLORS.find(({ color }) =>
    editorState[`highlight_${color}`]
  );

  return (
    <Tooltip>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 gap-1 px-2 rounded-lg"
            >
              <span 
                className="font-semibold"
                style={{ color: activeTextColor?.color || 'currentColor' }}
              >
                A
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <AppTooltipContent label="Text color" />

        <PopoverContent 
          align="start" 
          className="w-auto p-3"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* Recently used section */}
          <div className="mb-3">
            <p className="text-xs font-medium text-zinc-400 mb-2">Recently used</p>
            <div className="flex gap-1.5">
              {activeTextColor && activeTextColor.color && (
                <button
                  className="w-8 h-8 rounded-lg border border-zinc-700/50 flex items-center justify-center transition-transform hover:scale-105"
                  style={{ backgroundColor: activeTextColor.color }}
                  onClick={() => editor.chain().focus().setColor(activeTextColor.color).run()}
                />
              )}
              {activeHighlightColor && activeHighlightColor.color && (
                <button
                  className="w-8 h-8 rounded-lg border border-zinc-700/50 flex items-center justify-center transition-transform hover:scale-105"
                  style={{ backgroundColor: activeHighlightColor.color }}
                  onClick={() => editor.chain().focus().setHighlight({ color: activeHighlightColor.color }).run()}
                />
              )}
            </div>
          </div>

          {/* Text color section */}
          <div className="mb-3">
            <p className="text-xs font-medium text-zinc-400 mb-2">Text color</p>
            <div className="grid grid-cols-5 gap-1.5">
              {TEXT_COLORS.map(({ name, color }, index) => {
                const isActive = activeTextColor?.color === color;
                return (
                  <button
                    key={index}
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all hover:scale-105 ${
                      isActive 
                        ? 'border-white/40 ring-2 ring-white/20' 
                        : 'border-zinc-700/50 hover:border-zinc-600'
                    }`}
                    style={{ backgroundColor: '#1c1c1e' }}
                    onClick={() => {
                      if (name === "Default") {
                        editor.commands.unsetColor();
                      } else {
                        editor.chain().focus().setColor(color).run();
                      }
                    }}
                    title={name}
                  >
                    <span 
                      className="font-semibold text-sm"
                      style={{ color: color || '#9ca3af' }}
                    >
                      A
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Background color section */}
          <div>
            <p className="text-xs font-medium text-zinc-400 mb-2">Background color</p>
            <div className="grid grid-cols-5 gap-1.5">
              {BACKGROUND_COLORS.map(({ name, color }, index) => {
                const isActive = activeHighlightColor?.color === color;
                return (
                  <button
                    key={index}
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all hover:scale-105 ${
                      isActive 
                        ? 'border-white/40 ring-2 ring-white/20' 
                        : 'border-zinc-700/50 hover:border-zinc-600'
                    }`}
                    style={{ backgroundColor: color || 'transparent' }}
                    onClick={() => {
                      if (name === "Default") {
                        editor.commands.unsetHighlight();
                      } else {
                        editor.chain().focus().setHighlight({ color }).run();
                      }
                    }}
                    title={name}
                  />
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </Tooltip>
  );
};
