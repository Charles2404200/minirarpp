export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  isSelected: boolean;
  isExpanded: boolean;
  children?: FileNode[];
  size?: number;
  count?: number; // for folders: number of files inside
}

export interface TreeViewProps {
  roots: FileNode[];
  onSelectionChange: (updatedRoots: FileNode[]) => void;
  onExcludePatternChange: (pattern: string) => void;
  excludePattern: string;
  maxDepth?: number;
}

export type SelectionState = 'all' | 'partial' | 'none';
