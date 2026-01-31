import { useState, useRef } from 'react';
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
  const [touchDragging, setTouchDragging] = useState(false);
  const touchedElement = useRef<HTMLElement | null>(null);
  const ghostElement = useRef<HTMLDivElement | null>(null);

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

  // Touch handling for mobile
  const handleTouchStart = (task: Task, e: React.TouchEvent) => {
    e.preventDefault();
    setDraggedTask(task);
    setTouchDragging(true);
    touchedElement.current = e.currentTarget as HTMLElement;

    // Create ghost element
    const ghost = document.createElement('div');
    ghost.className = 'task-card-ghost';
    ghost.textContent = task.title;
    ghost.style.position = 'fixed';
    ghost.style.pointerEvents = 'none';
    ghost.style.opacity = '0.8';
    ghost.style.zIndex = '9999';
    ghost.style.left = '-9999px';
    document.body.appendChild(ghost);
    ghostElement.current = ghost;

    if (touchedElement.current) {
      touchedElement.current.style.opacity = '0.4';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragging || !ghostElement.current) return;
    
    const touch = e.touches[0];
    ghostElement.current.style.left = `${touch.clientX - 50}px`;
    ghostElement.current.style.top = `${touch.clientY - 20}px`;
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (!touchDragging || !draggedTask) return;

    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Find the column element
    const column = dropTarget?.closest('.kanban-column');
    if (column) {
      const columnStatus = column.getAttribute('data-status') as TaskStatus;
      if (columnStatus && draggedTask.status !== columnStatus) {
        try {
          await api.tasks.update(draggedTask.id, { status: columnStatus });
          onTaskUpdate();
        } catch (error) {
          console.error('Failed to update task status:', error);
        }
      }
    }

    // Cleanup
    if (ghostElement.current) {
      document.body.removeChild(ghostElement.current);
      ghostElement.current = null;
    }
    if (touchedElement.current) {
      touchedElement.current.style.opacity = '1';
      touchedElement.current = null;
    }
    setTouchDragging(false);
    setDraggedTask(null);
  };

  return (
    <div 
      className="kanban-board"
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {STATUS_ORDER.map((status) => (
        <div
          key={status}
          className={`kanban-column ${draggedTask && draggedTask.status !== status ? 'drop-target' : ''}`}
          data-status={status}
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
                onTouchStart={(e) => handleTouchStart(task, e)}
                onClick={() => onTaskSelect(task)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
