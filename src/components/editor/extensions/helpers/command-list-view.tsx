import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { animate, type AnimationPlaybackControls } from "motion";
import type {
  CommandListProps,
  SlashMenuItemType,
} from "@/components/editor/components/slash-menu/types";
import { cn } from "@/lib/tiptap-utils";

type CommandListRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

const MAX_VISIBLE_ITEMS = 6;

const CommandList = forwardRef<CommandListRef, CommandListProps>(
  ({ items, command, editor }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const viewportRef = useRef<HTMLDivElement>(null);
    const scrollAnimationRef = useRef<AnimationPlaybackControls | null>(null);

    const flatItems = useMemo(() => {
      return Object.values(items)
        .flat()
        .filter((item) => !item.disable || !item.disable(editor));
    }, [editor, items]);

    const selectItem = useCallback(
      (index: number) => {
        const item = flatItems[index];
        if (!item) return;
        command(item);
      },
      [command, flatItems],
    );

    const upHandler = useCallback(() => {
      if (!flatItems.length) return;
      setSelectedIndex((prev) => (prev + flatItems.length - 1) % flatItems.length);
    }, [flatItems.length]);

    const downHandler = useCallback(() => {
      if (!flatItems.length) return;
      setSelectedIndex((prev) => (prev + 1) % flatItems.length);
    }, [flatItems.length]);

    const enterHandler = useCallback(() => {
      selectItem(selectedIndex);
    }, [selectItem, selectedIndex]);

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: ({ event }) => {
          if (event.key === "ArrowUp") {
            upHandler();
            return true;
          }
          if (event.key === "ArrowDown") {
            downHandler();
            return true;
          }
          if (event.key === "Enter") {
            enterHandler();
            return true;
          }
          return false;
        },
      }),
      [downHandler, enterHandler, upHandler],
    );

    useEffect(() => {
      setSelectedIndex(0);
    }, [flatItems]);

    useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const itemElements = Array.from(
        viewport.querySelectorAll<HTMLElement>("[data-item-index]"),
      );
      if (!itemElements.length) return;

      const currentScrollTop = viewport.scrollTop;
      const firstItemTop = itemElements[0].offsetTop;
      const visibleCount = Math.min(MAX_VISIBLE_ITEMS, itemElements.length);

      let currentTopIndex = 0;
      for (let i = 0; i < itemElements.length; i += 1) {
        if (itemElements[i].offsetTop - firstItemTop <= currentScrollTop + 1) {
          currentTopIndex = i;
        } else {
          break;
        }
      }

      const currentBottomIndex = Math.min(
        itemElements.length - 1,
        currentTopIndex + visibleCount - 1,
      );

      let nextTopIndex = currentTopIndex;
      if (selectedIndex < currentTopIndex) {
        nextTopIndex = selectedIndex;
      } else if (selectedIndex > currentBottomIndex) {
        nextTopIndex = selectedIndex - visibleCount + 1;
      }

      const maxTopIndex = Math.max(0, itemElements.length - visibleCount);
      nextTopIndex = Math.max(0, Math.min(nextTopIndex, maxTopIndex));
      const nextScrollTop = Math.max(
        0,
        (itemElements[nextTopIndex]?.offsetTop ?? firstItemTop) - firstItemTop,
      );

      if (Math.abs(nextScrollTop - currentScrollTop) < 1) return;

      scrollAnimationRef.current?.stop();
      scrollAnimationRef.current = animate(currentScrollTop, nextScrollTop, {
        duration: 0.24,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (latest) => {
          viewport.scrollTop = latest;
        },
      });
    }, [selectedIndex]);

    useEffect(() => {
      return () => {
        scrollAnimationRef.current?.stop();
      };
    }, []);

    useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      scrollAnimationRef.current?.stop();
      viewport.scrollTop = 0;
    }, [flatItems]);

    if (!flatItems.length) return null;

    let runningIndex = -1;

    return (
      <div
        id="slash-command"
        className="h-slash-menu max-h-slash-menu w-[300px] overflow-y-auto overscroll-contain rounded-2xl border border-sidebar-container-border/80 bg-sidebar-container-bg p-1.5 shadow-dropdown [scrollbar-width:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0"
        ref={viewportRef}
      >
        {Object.entries(items).map(([category, categoryItems]) => {
          const visibleItems = categoryItems.filter(
            (item) => !item.disable || !item.disable(editor),
          );
          const showCategoryLabel =
            Object.keys(items).length > 1 || category.toLowerCase() !== "basic";

          if (!visibleItems.length) return null;

          return (
            <div key={category} className="mb-1.5 last:mb-0">
              {showCategoryLabel ? (
                <div className="px-2.5 py-1 text-xs font-medium capitalize tracking-tight text-foreground-muted-secondary">
                  {category}
                </div>
              ) : null}
              <div className="flex flex-col gap-0.5">
                {visibleItems.map((item: SlashMenuItemType) => {
                  runningIndex += 1;
                  const isSelected = runningIndex === selectedIndex;
                  const Icon = item.icon;

                  return (
                    <button
                      type="button"
                      data-item-index={runningIndex}
                      key={`${category}-${item.title}-${runningIndex}`}
                      onClick={() => selectItem(runningIndex)}
                      className={cn(
                        "group flex w-full items-start gap-2 rounded-xl border border-transparent px-2.5 py-2 text-left transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring/60",
                        isSelected
                          ? "border-border-elevated bg-sidebar-subitem-selected-bg text-foreground"
                          : "text-sidebar-foreground/90 hover:bg-sidebar-item-hover-bg/75 hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 inline-flex h-5 w-5 items-center justify-center",
                          isSelected ? "text-sidebar-foreground" : "text-unselected-icon",
                        )}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-sans-serif text-sm font-medium tracking-tight lowercase">
                          {item.title}
                        </span>
                        <span className="block truncate font-sans text-xs text-foreground-muted-secondary lowercase">
                          {item.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);


export default CommandList;
