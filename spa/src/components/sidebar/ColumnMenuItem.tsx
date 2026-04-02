import React from 'react';

type ColumnMenuItemProps = {
  columnKey: string;
  label: string;
  visible: boolean;
  draggable: boolean;
  isDragging: boolean;
  isDropBefore: boolean;
  isPinned: boolean;
  onToggle: (key: string) => void;
  onDragStart: (key: string, event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (key: string, event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (key: string, event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
};

export const ColumnMenuItem: React.FC<ColumnMenuItemProps> = ({
  columnKey,
  label,
  visible,
  draggable,
  isDragging,
  isDropBefore,
  isPinned,
  onToggle,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}) => (
  <div
    draggable={draggable}
    role="button"
    tabIndex={0}
    onDragStart={(event) => onDragStart(columnKey, event)}
    onDragOver={(event) => onDragOver(columnKey, event)}
    onDrop={(event) => onDrop(columnKey, event)}
    onDragEnd={onDragEnd}
    onClick={(event) => {
      const target = event.target as HTMLElement;
      if (target.closest('button') || target.closest('input')) return;
      onToggle(columnKey);
    }}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onToggle(columnKey);
      }
    }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 0',
      color: '#444',
      cursor: 'pointer',
      userSelect: 'none',
      opacity: isDragging ? 0.5 : 1,
      borderTop: isDropBefore ? '1px solid #1a73e8' : '1px solid transparent'
    }}
  >
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '24px',
        height: '24px',
        flexShrink: 0,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none'
      }}
    >
      ⋮⋮
    </span>
    <input
      type="checkbox"
      checked={visible}
      aria-label={label}
      onChange={() => onToggle(columnKey)}
      disabled={isPinned}
      onClick={(event) => event.stopPropagation()}
    />
    <span style={{ flex: 1 }}>{label}</span>
  </div>
);
