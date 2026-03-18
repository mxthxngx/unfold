export interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export interface TreeItemProps {
  node: Node;
  level: number;
  isOpen: boolean;
  selectedItem: string | null;
}

export interface Node {
  id: string;
  name: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
  parentId?: string;
  nodes?: Node[];
  isOpen?: boolean;
  isPinned?: boolean;
}
