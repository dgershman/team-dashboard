import type { Task } from '../services/api';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  onDragStart: () => void;
  onClick: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  P1: 'priority-high',
  P2: 'priority-medium',
  P3: 'priority-low',
};

export default function TaskCard({ task, onDragStart, onClick }: TaskCardProps) {
  return (
    <div
      className="task-card"
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
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
