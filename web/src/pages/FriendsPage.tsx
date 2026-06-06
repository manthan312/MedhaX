import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useFriendStore } from '../store/friendStore';
import { useAuthStore } from '../store/authStore';
import { initSocket } from '../services/socket';
import { v4 as uuidv4 } from 'uuid';

type Tab = 'all' | 'friends' | 'requests';

export default function FriendsPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [searchQ, setSearchQ] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const {
    friends,
    pendingRequests,
    sentRequests,
    searchResults,
    isLoading,
    fetchFriends,
    searchUsers,
    sendRequest,
    respondRequest,
    setFriendOnline,
  } = useFriendStore();

  const { user, isAuthenticated, token } = useAuthStore();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Initial data load ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchFriends();
    searchUsers('');
  }, [isAuthenticated]);

  // ── Real-time socket updates ────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const socket = initSocket(token);

    const refresh = () => {
      fetchFriends();
      searchUsers(searchQ);
    };

    const onReceived = () => {
      showToast('📩 New friend request received!', 'info');
      refresh();
    };
    const onAccepted = () => {
      showToast('🎉 Friend request accepted!', 'success');
      refresh();
    };
    const onDeclined = () => {
      refresh();
    };
    const onStatus = (data: { friendId: string; online: boolean }) => {
      setFriendOnline(data.friendId, data.online);
    };

    socket.on('friend.request.received', onReceived);
    socket.on('friend.request.accepted', onAccepted);
    socket.on('friend.request.declined', onDeclined);
    socket.on('friend.status', onStatus);

    return () => {
      socket.off('friend.request.received', onReceived);
      socket.off('friend.request.accepted', onAccepted);
      socket.off('friend.request.declined', onDeclined);
      socket.off('friend.status', onStatus);
    };
  }, [isAuthenticated, token, searchQ]);

  // ── Poll online status every 15s (not 8s) ─────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    const iv = setInterval(() => {
      fetchFriends();
      if (tab === 'all') searchUsers(searchQ);
    }, 15000);
    return () => clearInterval(iv);
  }, [isAuthenticated, tab, searchQ]);

  // ── Search debounce ────────────────────────────────────────────────────────
  const handleSearchChange = (val: string) => {
    setSearchQ(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchUsers(val), 350);
  };

  const handleSendRequest = async (userId: string, handle: string) => {
    try {
      const result = await sendRequest(userId);
      if ((result as any)?.already_pending) {
        showToast(`⏳ Request to ${handle} already pending.`, 'info');
      } else {
        showToast(`✅ Request sent to ${handle}!`, 'success');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not send request.';
      if (msg === 'Already friends') {
        showToast(`You're already friends with ${handle}!`, 'info');
      } else if (msg === 'Friend request already sent') {
        showToast(`⏳ Request already sent to ${handle}.`, 'info');
      } else {
        showToast(msg, 'error');
      }
    }
  };

  const handleRespond = async (friendshipId: string, accept: boolean, handle: string) => {
    try {
      await respondRequest(friendshipId, accept);
      showToast(
        accept ? `🎉 You and ${handle} are now friends!` : `Declined ${handle}'s request.`,
        accept ? 'success' : 'info'
      );
    } catch {
      showToast('Something went wrong.', 'error');
    }
  };

  const handleChallenge = (friendId: string) => {
    const matchId = uuidv4();
    navigate(`/lobby?matchId=${matchId}&friendId=${friendId}`);
  };

  // ── Lookup sets ────────────────────────────────────────────────────────────
  const friendIdSet  = new Set(friends.map(f => f.id));
  const pendingIdSet = new Set(pendingRequests.map(r => r.id));  // user IDs who sent me requests
  const sentIdSet    = new Set(sentRequests.map(r => r.id));      // user IDs I sent requests to

  const displayedUsers = searchResults.filter(u => u.id !== user?.id).slice(0, 15);

  return (
    <div className="page">
      <Navbar />

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}

      <div className="page-content" style={{ maxWidth: 760 }}>
        {/* Header */}
        <div className="fade-in" style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900 }}>Friends & Players</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Find players, add friends, and send coding challenges
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Friends', value: friends.length, icon: '👥', color: 'var(--green)' },
            { label: 'Incoming', value: pendingRequests.length, icon: '📩', color: '#fbbf24' },
            { label: 'Sent', value: sentRequests.length, icon: '📤', color: 'var(--indigo-light)' },
          ].map(s => (
            <div key={s.label} className="card" style={{
              flex: 1, minWidth: 110, padding: '14px 18px', textAlign: 'center',
              borderColor: s.label === 'Incoming' && s.value > 0 ? 'rgba(251,191,36,0.35)' : undefined,
            }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: s.color }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 24 }}>
          <button className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => { setTab('all'); searchUsers(searchQ); }}>
            🌍 All Players
          </button>
          <button className={`tab ${tab === 'friends' ? 'active' : ''}`} onClick={() => setTab('friends')}>
            👥 My Friends {friends.length > 0 && (
              <span className="badge badge-indigo" style={{ marginLeft: 6 }}>{friends.length}</span>
            )}
          </button>
          <button className={`tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
            📩 Requests {pendingRequests.length > 0 && (
              <span className="badge badge-yellow" style={{ marginLeft: 6 }}>{pendingRequests.length}</span>
            )}
          </button>
        </div>

        {/* ── Tab: All Players ─────────────────────────────────────────────── */}
        {tab === 'all' && (
          <div className="fade-in">
            <div className="input-group" style={{ marginBottom: 20 }}>
              <input
                className="input"
                type="text"
                placeholder="🔍 Search by username…"
                value={searchQ}
                onChange={e => handleSearchChange(e.target.value)}
                autoFocus
              />
            </div>

            {isLoading && displayedUsers.length === 0 && (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
                <div style={{ color: 'var(--text-muted)', marginTop: 16, fontSize: 14 }}>Loading players…</div>
              </div>
            )}

            {!isLoading && displayedUsers.length === 0 && (
              <EmptyState
                icon="🔍"
                title={searchQ ? 'No players found' : 'No other players yet'}
                sub={searchQ ? `No one matches "${searchQ}"` : 'Be the first to sign up your friends!'}
              />
            )}

            {displayedUsers.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: 0.5 }}>
                  {displayedUsers.length} player{displayedUsers.length !== 1 ? 's' : ''} found
                </div>
                {displayedUsers.map(u => {
                  const isFriend   = friendIdSet.has(u.id);
                  const hasPending = pendingIdSet.has(u.id);  // they sent ME a request
                  const hasSent    = sentIdSet.has(u.id);      // I sent THEM a request

                  return (
                    <div key={u.id} className="card card-glow" style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', padding: '14px 18px',
                    }}>
                      {/* Avatar + name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ position: 'relative' }}>
                          <div className="avatar avatar-md">{u.handle?.[0]?.toUpperCase()}</div>
                          <div className={`online-dot ${u.online ? '' : 'offline'}`}
                            style={{ position: 'absolute', bottom: 0, right: 0 }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{u.handle}</div>
                          <div style={{ fontSize: 12, color: u.online ? 'var(--green)' : 'var(--text-muted)' }}>
                            {u.online ? '🟢 Online' : '⚫ Offline'}
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        {isFriend ? (
                          <>
                            <span className="badge badge-green">✓ Friend</span>
                            {u.online ? (
                              <button className="btn btn-primary btn-sm" onClick={() => handleChallenge(u.id)}>
                                ⚔️ Challenge
                              </button>
                            ) : (
                              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Offline</span>
                            )}
                          </>
                        ) : hasPending ? (
                          // They sent ME a request — show inline accept/decline
                          <>
                            <span className="badge badge-yellow">📩 Sent you a request</span>
                            <button className="btn btn-success btn-sm" onClick={() => {
                              const req = pendingRequests.find(r => r.id === u.id);
                              if (req) handleRespond(req.friendship_id, true, u.handle);
                            }}>✓ Accept</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => {
                              const req = pendingRequests.find(r => r.id === u.id);
                              if (req) handleRespond(req.friendship_id, false, u.handle);
                            }}>✕</button>
                          </>
                        ) : hasSent ? (
                          <span className="badge badge-indigo">⏳ Request Sent</span>
                        ) : (
                          <button className="btn btn-primary btn-sm"
                            onClick={() => handleSendRequest(u.id, u.handle)}>
                            + Add Friend
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: My Friends ──────────────────────────────────────────────── */}
        {tab === 'friends' && (
          <div className="fade-in">
            {friends.length === 0 ? (
              <EmptyState
                icon="👥"
                title="No friends yet"
                sub="Go to 'All Players' tab to find and add friends!"
                action={<button className="btn btn-primary" onClick={() => setTab('all')}>Browse All Players →</button>}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {friends.map(f => (
                  <div key={f.id} className="card card-glow" style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '14px 18px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ position: 'relative' }}>
                        <div className="avatar avatar-md">{f.handle?.[0]?.toUpperCase()}</div>
                        <div className={`online-dot ${f.online ? '' : 'offline'}`}
                          style={{ position: 'absolute', bottom: 0, right: 0 }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{f.handle}</div>
                        <div style={{ fontSize: 12, color: f.online ? 'var(--green)' : 'var(--text-muted)' }}>
                          {f.online ? '🟢 Online' : '⚫ Offline'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="badge badge-green">✓ Friend</span>
                      {f.online ? (
                        <button className="btn btn-primary btn-sm" onClick={() => handleChallenge(f.id)}>
                          ⚔️ Challenge
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Offline</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Requests ─────────────────────────────────────────────────── */}
        {tab === 'requests' && (
          <div className="fade-in">
            {/* Incoming */}
            {pendingRequests.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: '#fbbf24',
                  marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1
                }}>
                  📩 Incoming — People who want to add you ({pendingRequests.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pendingRequests.map(r => (
                    <div key={r.friendship_id} className="card" style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', padding: '14px 18px',
                      borderColor: 'rgba(234,179,8,0.25)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div className="avatar avatar-md">{r.handle?.[0]?.toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{r.handle}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Wants to be your friend</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-success btn-sm"
                          onClick={() => handleRespond(r.friendship_id, true, r.handle)}>
                          ✓ Accept
                        </button>
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => handleRespond(r.friendship_id, false, r.handle)}>
                          ✕ Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sent */}
            {sentRequests.length > 0 && (
              <div>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: 'var(--indigo-light)',
                  marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1
                }}>
                  📤 Sent — Waiting for their response ({sentRequests.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sentRequests.map(r => (
                    <div key={r.friendship_id} className="card" style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', padding: '14px 18px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div className="avatar avatar-md">{r.handle?.[0]?.toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{r.handle}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Waiting for their response…</div>
                        </div>
                      </div>
                      <span className="badge badge-indigo">⏳ Pending</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingRequests.length === 0 && sentRequests.length === 0 && (
              <EmptyState
                icon="📬"
                title="No pending requests"
                sub="Send friend requests from the 'All Players' tab!"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  icon, title, sub, action
}: { icon: string; title: string; sub: string; action?: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{title}</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>{sub}</div>
      {action}
    </div>
  );
}
