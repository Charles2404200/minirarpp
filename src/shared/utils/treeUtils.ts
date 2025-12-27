import type { FileNode } from '../types/tree.types';

function generateId(): string {
  return 'node-' + Math.random().toString(36).substr(2, 9);
}

export function buildFileTree(paths: string[]): FileNode[] {
  const nodeMap = new Map<string, FileNode>();
  const roots: FileNode[] = [];

  for (const path of paths) {
    const parts = path.split('\\').filter(p => p);
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      currentPath = currentPath ? `${currentPath}\\${name}` : name;
      
      if (!nodeMap.has(currentPath)) {
        const isFile = i === parts.length - 1;
        const node: FileNode = {
          id: generateId(),
          name,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          isSelected: true,
          isExpanded: i === 0, // Expand root by default
          children: isFile ? undefined : []
        };
        nodeMap.set(currentPath, node);

        if (i === 0) {
          roots.push(node);
        } else {
          const parentPath = parts.slice(0, i).join('\\');
          const parent = nodeMap.get(parentPath);
          if (parent && parent.children) {
            parent.children.push(node);
          }
        }
      }

      if (i < parts.length - 1) {
        const node = nodeMap.get(currentPath);
        if (node && !node.children) {
          node.children = [];
        }
      }
    }
  }

  return roots;
}

export function getSelectedPaths(nodes: FileNode[]): string[] {
  const paths: string[] = [];

  function traverse(node: FileNode) {
    if (node.type === 'file' && node.isSelected) {
      paths.push(node.path);
    } else if (node.type === 'folder' && node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  for (const node of nodes) {
    traverse(node);
  }

  return paths;
}

export function getStats(nodes: FileNode[]): { files: number; folders: number; size: number } {
  let files = 0;
  let folders = 0;
  let size = 0;

  function traverse(node: FileNode) {
    if (node.type === 'file' && node.isSelected) {
      files++;
      if (node.size) size += node.size;
    } else if (node.type === 'folder') {
      folders++;
      if (node.children) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    }
  }

  for (const node of nodes) {
    traverse(node);
  }

  return { files, folders, size };
}
