import { useState } from 'react';
import type { FileNode, SelectionState } from '../types/tree.types';
import '../styles/TreeView.css';

interface TreeViewProps {
  roots: FileNode[];
  onSelectionChange: (updated: FileNode[]) => void;
  onExcludePatternChange: (pattern: string) => void;
  excludePattern: string;
}

export function TreeView({ roots, onSelectionChange, onExcludePatternChange, excludePattern }: TreeViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const matchesPattern = (path: string, pattern: string): boolean => {
    if (!pattern.trim()) return false;
    
    // Simple glob-like pattern matching
    const parts = pattern.split(',').map(p => p.trim().toLowerCase());
    const pathLower = path.toLowerCase();
    
    return parts.some(part => {
      if (part.startsWith('*.')) {
        // Extension match: *.log, *.tmp
        return pathLower.endsWith(part.substring(1));
      } else if (part.includes('*')) {
        // Wildcard match
        const regex = new RegExp('^' + part.replace(/\*/g, '.*') + '$');
        return regex.test(pathLower);
      } else {
        // Exact match or contains
        return pathLower.includes(part);
      }
    });
  };

  const updateNodeSelection = (nodes: FileNode[], nodeId: string, selected: boolean): FileNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          isSelected: selected,
          children: node.children ? updateAllChildren(node.children, selected) : undefined
        };
      }
      if (node.children) {
        return {
          ...node,
          children: updateNodeSelection(node.children, nodeId, selected)
        };
      }
      return node;
    });
  };

  const updateAllChildren = (nodes: FileNode[], selected: boolean): FileNode[] => {
    return nodes.map(node => ({
      ...node,
      isSelected: selected,
      children: node.children ? updateAllChildren(node.children, selected) : undefined
    }));
  };

  const handleCheck = (nodeId: string, selected: boolean) => {
    const updated = updateNodeSelection(roots, nodeId, selected);
    onSelectionChange(updated);
  };

  const getSelectionState = (node: FileNode): SelectionState => {
    if (!node.children || node.children.length === 0) {
      return node.isSelected ? 'all' : 'none';
    }
    const selectedCount = node.children.filter(c => c.isSelected).length;
    if (selectedCount === 0) return 'none';
    if (selectedCount === node.children.length) return 'all';
    return 'partial';
  };

  const countFiles = (node: FileNode): number => {
    if (node.type === 'file') return node.isSelected ? 1 : 0;
    if (!node.children) return 0;
    return node.children.reduce((sum, child) => sum + countFiles(child), 0);
  };

  const isHidden = (node: FileNode): boolean => {
    return matchesPattern(node.path, excludePattern);
  };

  const renderNode = (node: FileNode, level: number) => {
    if (isHidden(node)) return null;

    const selectionState = getSelectionState(node);
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const visibleChildren = node.children?.filter(c => !isHidden(c)) || [];

    return (
      <div key={node.id} className="tree-item" style={{ paddingLeft: `${level * 16}px` }}>
        <div className="tree-node">
          <div className="tree-node-left">
            {hasChildren && (
              <button
                className={`tree-toggle ${isExpanded ? 'expanded' : ''}`}
                onClick={() => toggleExpand(node.id)}
              >
                ▶
              </button>
            )}
            {!hasChildren && <div className="tree-toggle-space" />}

            <input
              type="checkbox"
              className={`tree-checkbox state-${selectionState}`}
              checked={node.isSelected}
              onChange={(e) => handleCheck(node.id, e.target.checked)}
              ref={(el) => {
                if (el) el.indeterminate = selectionState === 'partial';
              }}
            />
          </div>

          <div className="tree-node-content">
            <span className={`tree-icon ${node.type}`}>
              {node.type === 'folder' ? '📁' : '📄'}
            </span>
            <span className="tree-name">{node.name}</span>
            {node.type === 'folder' && visibleChildren.length > 0 && (
              <span className="tree-count">({visibleChildren.length})</span>
            )}
            {node.type === 'file' && node.size && (
              <span className="tree-size">{formatSize(node.size)}</span>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="tree-children">
            {visibleChildren.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const totalSelected = roots.reduce((sum, root) => sum + countFiles(root), 0);

  return (
    <div className="tree-view-container">
      <div className="tree-controls">
        <div>
          <label>Exclude pattern (*.log, *.tmp, node_modules)</label>
          <input
            type="text"
            className="exclude-input"
            placeholder="*.log, *.tmp, node_modules"
            value={excludePattern}
            onChange={(e) => onExcludePatternChange(e.target.value)}
          />
          <div className="pattern-help">
            Separate multiple patterns with commas. Use * for wildcards.
          </div>
        </div>
      </div>

      <div className="tree-stats">
        <span>{totalSelected} file(s) will be compressed</span>
      </div>

      <div className="tree-view">
        {roots.length === 0 ? (
          <div className="tree-empty">Add files or folders to compress</div>
        ) : (
          roots.map(root => renderNode(root, 0))
        )}
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
