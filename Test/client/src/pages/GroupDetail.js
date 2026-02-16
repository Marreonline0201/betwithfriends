import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';

function GroupDetail() {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newGameName, setNewGameName] = useState('');
  const [expandedGame, setExpandedGame] = useState(null);
  const [gameData, setGameData] = useState({}); // { gameId: { bets, wins, leaderboard } }

  useEffect(() => {
    loadGroup();
  }, [id]);

  useEffect(() => {
    if (group) loadGames();
  }, [group]);

  async function loadGroup() {
    try {
      const data = await api.groups.get(id);
      setGroup(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadGames() {
    if (!group) return;
    try {
      const data = await api.games.list(group.id);
      setGames(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadGameData(gameId) {
    try {
      const [bets, wins, leaderboard] = await Promise.all([
        api.bets.list(gameId),
        api.wins.list(gameId),
        api.wins.leaderboard(gameId),
      ]);
      setGameData((prev) => ({
        ...prev,
        [gameId]: { bets, wins, leaderboard },
      }));
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleGame(gameId) {
    if (expandedGame === gameId) {
      setExpandedGame(null);
    } else {
      setExpandedGame(gameId);
      if (!gameData[gameId]) loadGameData(gameId);
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    setError('');
    try {
      await api.groups.addMember(id, newMemberEmail.trim());
      setNewMemberEmail('');
      loadGroup();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemoveMember(userId) {
    if (!window.confirm('Remove this member from the group?')) return;
    try {
      await api.groups.removeMember(id, userId);
      loadGroup();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateGame(e) {
    e.preventDefault();
    if (!newGameName.trim()) return;
    setError('');
    try {
      await api.games.create(newGameName.trim(), id);
      setNewGameName('');
      loadGames();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteGame(gameId) {
    if (!window.confirm('Delete this game and all its bets/wins?')) return;
    try {
      await api.games.delete(gameId);
      setExpandedGame(null);
      loadGames();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddBet(gameId, description) {
    if (!description?.trim()) return;
    try {
      await api.bets.create(gameId, description.trim());
      loadGameData(gameId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteBet(betId, gameId) {
    try {
      await api.bets.delete(betId);
      loadGameData(gameId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddWin(gameId, userId) {
    try {
      await api.wins.add(gameId, userId);
      loadGameData(gameId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteWin(winId, gameId) {
    try {
      await api.wins.delete(winId);
      loadGameData(gameId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteBetInline(betId, gameId, e) {
    e?.preventDefault();
    if (!window.confirm('Delete this bet?')) return;
    await handleDeleteBet(betId, gameId);
  }

  async function handleDeleteWinInline(winId, gameId, e) {
    e?.preventDefault();
    if (!window.confirm('Remove this win?')) return;
    await handleDeleteWin(winId, gameId);
  }

  if (loading || !group) {
    return (
      <div className="layout">
        <p style={{ color: 'var(--text-muted)' }}>{loading ? 'Loading...' : 'Group not found'}</p>
      </div>
    );
  }

  return (
    <div className="layout">
      <Link to="/" className="back-link">← Back to groups</Link>

      <header className="header">
        <h1>{group.name}</h1>
      </header>

      {error && <div className="error" style={{ marginBottom: 20 }}>{error}</div>}

      {/* Members */}
      <div className="card">
        <h2>Members</h2>
        <form onSubmit={handleAddMember} className="form-row">
          <input
            type="email"
            placeholder="Add member by email"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>
        <div className="card-list" style={{ marginTop: 16 }}>
          {group.members?.map((m) => (
            <div key={m.id} className="card-item">
              <div className="info">
                <div className="name">{m.name}</div>
                <div className="meta">{m.email}</div>
              </div>
              <div className="actions">
                <button
                  className="btn-icon delete"
                  onClick={() => handleRemoveMember(m.id)}
                  title="Remove from group"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Games */}
      <div className="card">
        <h2>Games</h2>
        <form onSubmit={handleCreateGame} className="form-row">
          <input
            type="text"
            placeholder="Game name (e.g. Chess, Mario Kart)"
            value={newGameName}
            onChange={(e) => setNewGameName(e.target.value)}
          />
          <button type="submit">Add Game</button>
        </form>

        {games.length === 0 ? (
          <div className="empty-state">
            <p>No games yet. Add one above!</p>
          </div>
        ) : (
          <div className="game-section" style={{ marginTop: 24 }}>
            {games.map((game) => (
              <div key={game.id} className="game-card">
                <div className="game-card-header">
                  <h4>{game.name}</h4>
                  <div className="actions">
                    <button
                      className="btn-icon delete"
                      onClick={() => handleDeleteGame(game.id)}
                      title="Delete game"
                    >
                      ×
                    </button>
                    <button
                      className="btn-icon add"
                      onClick={() => toggleGame(game.id)}
                      title={expandedGame === game.id ? 'Collapse' : 'Expand'}
                    >
                      {expandedGame === game.id ? '−' : '+'}
                    </button>
                  </div>
                </div>

                {expandedGame === game.id && (
                  <>
                    {gameData[game.id]?.leaderboard && (
                      <div className="leaderboard" style={{ marginBottom: 20 }}>
                        {gameData[game.id].leaderboard.map((lb, i) => (
                          <div key={lb.id} className="leaderboard-item">
                            <span className="rank">#{i + 1}</span>
                            <span className="name">{lb.name}</span>
                            <span className="wins">{lb.win_count} wins</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <h3>Bets</h3>
                    <AddBetForm gameId={game.id} onAdd={handleAddBet} />
                    <div className="bet-list" style={{ marginTop: 12 }}>
                      {gameData[game.id]?.bets?.map((b) => (
                        <div key={b.id} className="bet-item">
                          <span>{b.description}</span>
                          <button
                            className="btn-icon delete"
                            onClick={(e) => handleDeleteBetInline(b.id, game.id, e)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {(!gameData[game.id]?.bets || gameData[game.id].bets.length === 0) && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No bets yet</p>
                      )}
                    </div>

                    <h3 style={{ marginTop: 20 }}>Wins</h3>
                    <div className="add-win-buttons">
                      {group.members?.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => handleAddWin(game.id, m.id)}
                        >
                          + {m.name} won
                        </button>
                      ))}
                    </div>
                    <div className="win-list" style={{ marginTop: 12 }}>
                      {gameData[game.id]?.wins?.map((w) => (
                        <div key={w.id} className="win-item">
                          <span className="user-name">{w.user_name} won</span>
                          <button
                            className="btn-icon delete"
                            onClick={(e) => handleDeleteWinInline(w.id, game.id, e)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {(!gameData[game.id]?.wins || gameData[game.id].wins.length === 0) && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No wins recorded yet</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AddBetForm({ gameId, onAdd }) {
  const [desc, setDesc] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAdd(gameId, desc);
        setDesc('');
      }}
      className="form-row"
    >
      <input
        type="text"
        placeholder="Bet description (e.g. Loser buys dinner)"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
      <button type="submit">Add Bet</button>
    </form>
  );
}

export default GroupDetail;
