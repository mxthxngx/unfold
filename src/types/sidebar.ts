export interface SidebarProps {
  selectedItem?: string;
  onSelectItem?: (item: string) => void;
}

export interface TreeItemProps {
  name: string;
  isExpanded?: boolean;
  isSelected?: boolean;
  hasChildren?: boolean;
  onClick?: (rect?: DOMRect) => void;
  onExpandClick?: () => void;
  children?: React.ReactNode;
  level?: number;
}

export interface Node {
  name: string;
  nodes?: Node[];
}
