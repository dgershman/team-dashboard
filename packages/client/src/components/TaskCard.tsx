import { useState } from 'react';
import type { Task } from '../services/api';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  onDragStart: () => void;
  onClick: () => void;
  onTouchStart?: (e: React.TouchEvent) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  P1: 'priority-high',
  P2: 'priority-medium',
  P3: 'priority-low',
};

export default function TaskCard({ task, onDragStart, onClick, onTouchStart }: TaskCardProps) {
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Start long press timer for dragging
    const timer = setTimeout(() => {
      if (onTouchStart) {
        onTouchStart(e);
      }
    }, 200); // 200ms long press to start drag
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    // Clear timer if touch ends before long press
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  return (
    <div
      className="task-card"
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div className="task-card-header">
        <span className={`priority-badge ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority}
        </span>
        {task.due_date && (
          <span className="due-date">
            {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
      </div>
      <h4 className="task-title">{task.title}</h4>
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}
    </div>
  );
}
