"use client";

import { StatusPill } from "./StatusPill";

interface ForkNode {
  id: string;
  title: string;
  status: string;
  forkDepth: number;
  forkReason?: string | null;
  isCanonical: boolean;
  parameters?: Record<string, unknown>;
  owner?: { name: string };
  forks?: ForkNode[];
}

interface ForkTreeProps {
  root: ForkNode;
  selectedIds?: string[];
  onSelect?: (id: string) => void;
  compact?: boolean;
}

export function ForkTree({ root, selectedIds = [], onSelect, compact = false }: ForkTreeProps) {
  return (
    <div className="font-sans">
      <ForkTreeNode
        node={root}
        depth={0}
        selectedIds={selectedIds}
        onSelect={onSelect}
        compact={compact}
        isLast={true}
      />
    </div>
  );
}

function ForkTreeNode({
  node,
  depth,
  selectedIds,
  onSelect,
  compact,
  isLast,
}: {
  node: ForkNode;
  depth: number;
  selectedIds: string[];
  onSelect?: (id: string) => void;
  compact: boolean;
  isLast: boolean;
}) {
  const isSelected = selectedIds.includes(node.id);
  const hasChildren = node.forks && node.forks.length > 0;

  return (
    <div>
      <div
        className={`flex items-start gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors ${
          isSelected ? "bg-[#1a1a24] border border-[#3b82f6]" : "hover:bg-[#1a1a24]"
        }`}
        style={{ marginLeft: depth * 24 }}
        onClick={() => onSelect?.(node.id)}
      >
        {depth > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 16 16" className="text-[#555570]">
              <path
                d={isLast ? "M8 0V8H16" : "M8 0V16M8 8H16"}
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
            </svg>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{node.title}</span>
            <StatusPill status={node.status} />
            {node.isCanonical && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#8b5cf6]/15 text-[#8b5cf6]">
                CANONICAL
              </span>
            )}
          </div>

          {!compact && (
            <div className="flex items-center gap-3 mt-0.5">
              {node.forkReason && (
                <span className="text-xs text-[#8888a8]">Reason: {node.forkReason}</span>
              )}
              {node.owner && (
                <span className="text-xs text-[#555570]">{node.owner.name}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {hasChildren &&
        node.forks!.map((child, i) => (
          <ForkTreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedIds={selectedIds}
            onSelect={onSelect}
            compact={compact}
            isLast={i === node.forks!.length - 1}
          />
        ))}
    </div>
  );
}
