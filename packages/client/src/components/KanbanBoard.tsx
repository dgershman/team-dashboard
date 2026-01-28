import { useState } from 'react';
import type { Task, TaskStatus, KanbanBoard as KanbanBoardType } from '../services/api';
import { api } from '../services/api';
import TaskCard from './TaskCard';
import './KanbanBoard.css';

interface KanbanBoardProps {
  board: KanbanBoardType;
  onTaskUpdate: () => void;
  onTaskSelect: (task: Task) => void;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  completed: 'Completed',
};

const STATUS_ORDER: TaskStatus[] = ['not_started', 'in_progress', 'blocked', 'completed'];

export default function KanbanBoard({ board, onTaskUpdate, onTaskSelect }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: TaskStatus) => {
    if (!draggedTask || draggedTask.status === status) {
      setDraggedTask(null);
      return;
    }

    try {
      await api.tasks.update(draggedTask.id, { status });
      onTaskUpdate();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }

    setDraggedTask(null);
  };

  return (
    <div className="kanban-board">
      {STATUS_ORDER.map((status) => (
        <div
          key={status}
          className={`kanban-column ${draggedTask && draggedTask.status !== status ? 'drop-target' : ''}`}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(status)}
        >
          <div className="kanban-column-header">
            <h3>{STATUS_LABELS[status]}</h3>
            <span className="task-count">{board[status].length}</span>
          </div>
          <div className="kanban-column-content">
            {board[status].map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDragStart={() => handleDragStart(task)}
                onClick={() => onTaskSelect(task)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
