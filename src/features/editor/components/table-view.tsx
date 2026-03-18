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
        </div>

        <button
          className="add-column-button"
          onClick={() => {
            editor.commands.addColumnAfter();
          }}
          aria-label="Add column"
        >
          <Plus size={17} className="text-table-text-muted" />
        </button>
      </div>
      
      <button
        className="add-row-button"
        onClick={() => {
          editor.commands.addRowAfter();
        }}
        aria-label="Add row"
      >
        <Plus size={17} className="inline text-table-text-muted" />
      </button>
    </NodeViewWrapper>
  );
};

export default TableView;
