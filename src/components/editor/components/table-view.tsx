import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { Plus } from "lucide-react";
import { Editor } from "@tiptap/core";

interface TableViewProps {
  editor: Editor;
}

const TableView: React.FC<TableViewProps> = ({ editor }) => {
  return (
    <NodeViewWrapper className="table-wrapper">
      <div className="flex relative" autoCorrect="false" autoCapitalize="false">
        <div className="overflow-x-auto w-full relative">
          <NodeViewContent />
          <button
            className="absolute left-0 w-[calc(100%-30px)] cursor-pointer border border-table-border text-sm text-center bg-table-surface border-dashed mt-1 py-1 opacity-0 hover:opacity-100 select-none transition-opacity duration-150 rounded-sm"
            onClick={() => {
              editor.commands.addRowAfter();
            }}
            aria-label="Add row"
            style={{ top: '100%' }}
          >
            <Plus size={17} className="inline text-table-text-muted" />
          </button>
        </div>

        <button
          className="flex border border-table-border text-sm text-center bg-table-surface border-dashed opacity-0 hover:opacity-100 ml-1 px-1 select-none transition-opacity duration-150 rounded-sm items-center justify-center min-h-full sticky right-0 flex-shrink-0"
          onClick={() => {
            editor.commands.addColumnAfter();
          }}
          aria-label="Add column"
        >
          <Plus size={17} className="text-table-text-muted" />
        </button>
      </div>
    </NodeViewWrapper>
  );
};

export default TableView;
