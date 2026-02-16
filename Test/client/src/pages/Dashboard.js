import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

function Dashboard() {
  const { user, logout } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    try {
      const data = await api.groups.list();
      setGroups(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGroup(e) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setError('');
    try {
      const group = await api.groups.create(newGroupName.trim());
      setGroups([group, ...groups]);
      setNewGroupName('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="layout">
      <header className="header">
        <h1>Bet Tracker</h1>
        <div className="user-info">
          <span className="user-name">Hi, {user?.name}</span>
          <button onClick={logout}>Log out</button>
        </div>
      </header>

      <div className="card">
        <h2>Your Groups</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: '0.95rem' }}>
          Create a group to start tracking bets with friends or your partner. Add members by their email.
        </p>

        <form onSubmit={handleCreateGroup} className="form-row">
          <input
            type="text"
            placeholder="Group name (e.g. Me & Sarah)"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <button type="submit">Create Group</button>
        </form>

        {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}

        {loading ? (
          <p style={{ color: 'var(--text-muted)', marginTop: 20 }}>Loading...</p>
        ) : groups.length === 0 ? (
          <div className="empty-state">
            <p>No groups yet. Create one above to get started!</p>
          </div>
        ) : (
          <div className="card-list" style={{ marginTop: 20 }}>
            {groups.map((group) => (
              <div key={group.id} className="card-item">
                <div className="info">
                  <div className="name">{group.name}</div>
                  <div className="meta">Created by {group.created_by_name}</div>
                </div>
                <Link
                  to={`/group/${group.id}`}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--accent)',
                    color: 'white',
                    borderRadius: 'var(--radius-sm)',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  Open
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
