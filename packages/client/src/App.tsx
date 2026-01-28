import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import type { Team, User, Task, KanbanBoard as KanbanBoardType } from './services/api';
import { api } from './services/api';
import KanbanBoard from './components/KanbanBoard';
import TaskDetail from './components/TaskDetail';
import CreateTaskModal from './components/CreateTaskModal';
import './App.css';

function Dashboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [board, setBoard] = useState<KanbanBoardType | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadTeams = async () => {
    try {
      const data = await api.teams.list();
      setTeams(data);
      if (data.length > 0 && !currentTeam) {
        setCurrentTeam(data[0]);
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
  };

  const loadBoard = async () => {
    if (!currentTeam) return;
    try {
      const data = await api.tasks.getKanban(currentTeam.id);
      setBoard(data);
    } catch (error) {
      console.error('Failed to load board:', error);
    }
  };

  const loadTeamMembers = async () => {
    if (!currentTeam) return;
    try {
      const data = await api.users.list(currentTeam.id);
      setTeamMembers(data);
      if (data.length > 0 && !currentUser) {
        setCurrentUser(data[0]);
      }
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  const setupDemoData = async () => {
    // Check if demo data already exists
    const existingTeams = await api.teams.list();
    if (existingTeams.length > 0) {
      setIsLoading(false);
      return;
    }

    // Create demo team
    const team = await api.teams.create({
      name: 'Demo Team',
      description: 'A demo team to showcase the dashboard',
    });

    // Create demo users
    const user1 = await api.users.create({
      email: 'alice@example.com',
      name: 'Alice',
      team_id: team.id,
      role: 'admin',
    });

    const user2 = await api.users.create({
      email: 'bob@example.com',
      name: 'Bob',
      team_id: team.id,
      role: 'member',
    });

    // Create demo tasks
    await api.tasks.create({
      team_id: team.id,
      title: 'Set up project infrastructure',
      description: 'Configure build tools, linting, and CI/CD',
      priority: 'P1',
      created_by_id: user1.id,
      assignee_id: user1.id,
    });

    await api.tasks.create({
      team_id: team.id,
      title: 'Design database schema',
      description: 'Create ERD and define table structures',
      priority: 'P2',
      created_by_id: user1.id,
      assignee_id: user2.id,
    });

    await api.tasks.create({
      team_id: team.id,
      title: 'Write API documentation',
      description: 'Document all endpoints with examples',
      priority: 'P3',
      created_by_id: user2.id,
    });

    setIsLoading(false);
  };

  useEffect(() => {
    setupDemoData().then(loadTeams);
  }, []);

  useEffect(() => {
    if (currentTeam) {
      loadBoard();
      loadTeamMembers();
    }
  }, [currentTeam]);

  if (isLoading) {
    return (
      <div className="app loading">
        <p>Setting up dashboard...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Team Dashboard</h1>
          {teams.length > 0 && (
            <select
              value={currentTeam?.id || ''}
              onChange={(e) => {
                const team = teams.find((t) => t.id === e.target.value);
                setCurrentTeam(team || null);
              }}
              className="team-selector"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="header-right">
          {currentUser && (
            <span className="current-user">
              {currentUser.name}
            </span>
          )}
          <button className="btn-create" onClick={() => setShowCreateModal(true)}>
            + New Task
          </button>
        </div>
      </header>

      <main className="app-main">
        {board ? (
          <KanbanBoard
            board={board}
            onTaskUpdate={loadBoard}
            onTaskSelect={setSelectedTask}
          />
        ) : (
          <div className="no-board">
            <p>No team selected or no tasks available.</p>
          </div>
        )}
      </main>

      {selectedTask && (
        <TaskDetail
          taskId={selectedTask.id}
          teamMembers={teamMembers}
          onClose={() => setSelectedTask(null)}
          onUpdate={loadBoard}
        />
      )}

      {showCreateModal && currentTeam && currentUser && (
        <CreateTaskModal
          teamId={currentTeam.id}
          currentUserId={currentUser.id}
          teamMembers={teamMembers}
          onClose={() => setShowCreateModal(false)}
          onCreate={loadBoard}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
