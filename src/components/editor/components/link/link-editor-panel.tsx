import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup } from "@/components/ui/input-group";
import { Link } from "lucide-react";
import { LinkEditorPanelProps } from "./types";
import { useLinkEditorState } from "./use-link-editor-state";


export const LinkEditorPanel = ({
  onSetLink,
  initialUrl,
}: LinkEditorPanelProps) => {
  const state = useLinkEditorState({
    onSetLink,
    initialUrl,
  });

  return (
    <div>
      <form onSubmit={state.handleSubmit}>
        <InputGroup className="text-nowrap flex items-center gap-2 bg-sidebar-item-hover-bg/50">
          <Input
            placeholder={"paste link"}
            value={state.url}
            onChange={state.onChange}
          />
          <Link size={16} />
          <Button
            variant="outline"
            size="lg"
            type="submit"
            disabled={!state.isValidUrl}
            className="cursor-pointer justify-start gap-2 px-3 py-2 text-sm font-semibold text-sidebar-foreground bg-sidebar-item-hover-bg/60 border-2 border-sidebar-border/70 hover:bg-sidebar-item-hover-bg/80 transition-all duration-200 w-fit"
          >
            save
          </Button>
        </InputGroup>
      </form>
    </div>
  );
};
