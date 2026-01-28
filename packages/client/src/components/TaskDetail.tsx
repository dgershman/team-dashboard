import { useState, useEffect } from 'react';
import type { TaskWithComments, TaskStatus, TaskPriority, User } from '../services/api';
import { api } from '../services/api';
import './TaskDetail.css';

interface TaskDetailProps {
  taskId: string;
  teamMembers: User[];
  onClose: () => void;
  onUpdate: () => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'completed', label: 'Completed' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'P1', label: 'P1 - High' },
  { value: 'P2', label: 'P2 - Medium' },
  { value: 'P3', label: 'P3 - Low' },
];

export default function TaskDetail({ taskId, teamMembers, onClose, onUpdate }: TaskDetailProps) {
  const [task, setTask] = useState<TaskWithComments | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadTask = async () => {
    try {
      const data = await api.tasks.get(taskId);
      setTask(data);
    } catch (error) {
      console.error('Failed to load task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const handleStatusChange = async (status: TaskStatus) => {
    if (!task) return;
    try {
      await api.tasks.update(task.id, { status });
      loadTask();
      onUpdate();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handlePriorityChange = async (priority: TaskPriority) => {
    if (!task) return;
    try {
      await api.tasks.update(task.id, { priority });
      loadTask();
      onUpdate();
    } catch (error) {
      console.error('Failed to update priority:', error);
    }
  };

  const handleAssigneeChange = async (assigneeId: string) => {
    if (!task) return;
    try {
      await api.tasks.update(task.id, { assignee_id: assigneeId || null });
      loadTask();
      onUpdate();
    } catch (error) {
      console.error('Failed to update assignee:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newComment.trim()) return;

    try {
      await api.tasks.addComment(task.id, { content: newComment });
      setNewComment('');
      loadTask();
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  if (isLoading) {
    return <div className="task-detail-overlay"><div className="task-detail loading">Loading...</div></div>;
  }

  if (!task) {
    return <div className="task-detail-overlay"><div className="task-detail">Task not found</div></div>;
  }

  return (
    <div className="task-detail-overlay" onClick={onClose}>
      <div className="task-detail" onClick={(e) => e.stopPropagation()}>
        <div className="task-detail-header">
          <h2>{task.title}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="task-detail-body">
          <div className="task-detail-main">
            {task.description && (
              <div className="task-description-full">
                <h4>Description</h4>
                <p>{task.description}</p>
              </div>
            )}

            <div className="comments-section">
              <h4>Activity</h4>
              <div className="comments-list">
                {task.comments.length === 0 ? (
                  <p className="no-comments">No comments yet</p>
                ) : (
                  task.comments.map((comment) => (
                    <div key={comment.id} className={`comment ${comment.is_automated ? 'automated' : ''}`}>
                      <div className="comment-header">
                        <span className="comment-author">
                          {comment.is_automated ? '[Automated]' : 'Team Member'}
                        </span>
                        <span className="comment-date">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="comment-content">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="comment-form">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                />
                <button type="submit" disabled={!newComment.trim()}>
                  Add Comment
                </button>
              </form>
            </div>
          </div>

          <div className="task-detail-sidebar">
            <div className="sidebar-section">
              <label>Status</label>
              <select value={task.status} onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="sidebar-section">
              <label>Priority</label>
              <select value={task.priority} onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}>
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="sidebar-section">
              <label>Assignee</label>
              <select
                value={task.assignee_id || ''}
                onChange={(e) => handleAssigneeChange(e.target.value)}
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>

            {task.due_date && (
              <div className="sidebar-section">
                <label>Due Date</label>
                <p>{new Date(task.due_date).toLocaleDateString()}</p>
              </div>
            )}

            <div className="sidebar-section">
              <label>Created</label>
              <p>{new Date(task.created_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
