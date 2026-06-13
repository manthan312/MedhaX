import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080') + '/api';

interface UserAchievement {
  achievement_type: string;
  unlocked_at?: string;
}

interface AchievementMeta {
  type: string;
  title: string;
  description: string;
  rewardTitle: string;
  icon: string;
  color: string;
}

const ACHIEVEMENTS_LIST: AchievementMeta[] = [
  {
    type: 'first_win',
    title: 'First Blood',
    description: 'Win your first multiplayer coding match.',
    rewardTitle: 'Vanquisher',
    icon: '🏆',
    color: 'var(--indigo-light)'
  },
  {
    type: 'perfectionist',
    title: 'Perfectionist',
    description: 'Score 40 or more points in a single match.',
    rewardTitle: 'Coding Guru',
    icon: '🔮',
    color: 'var(--yellow)'
  }
];

export default function AchievementsPanel() {
  const { token, user, updateUser } = useAuthStore();
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [activeTitle, setActiveTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchAchievements = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API}/users/achievements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAchievements(res.data.achievements || []);
      setActiveTitle(res.data.activeTitle || null);
    } catch (err) {
      console.error('[AchievementsPanel] failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, [token]);

  const handleEquipTitle = async (titleToEquip: string | null) => {
    if (!token) return;
    setUpdating(titleToEquip || 'unequip');
    try {
      await axios.put(`${API}/users/title`, { title: titleToEquip }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveTitle(titleToEquip);
      // Also update global auth store user object
      if (user) {
        updateUser({ ...user, active_title: titleToEquip });
      }
    } catch (err) {
      console.error('[AchievementsPanel] Failed to equip title:', err);
      alert('Failed to equip title.');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
          Loading achievements registry…
        </p>
      </div>
    );
  }

  // Set of unlocked types
  const unlockedTypes = new Set(achievements.map(a => a.achievement_type));

  return (
    <div className="card fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>🏅 Achievements & Titles</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
          Unlock credentials by proving your coding mettle and equip them as titles
        </p>
      </div>

      {/* Active Equipped Title */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px dashed var(--border)',
        borderRadius: 12,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Active Equipped Title
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--indigo-light)', marginTop: 4 }}>
            {activeTitle ? `« ${activeTitle} »` : 'None equipped'}
          </div>
        </div>
        {activeTitle && (
          <button
            onClick={() => handleEquipTitle(null)}
            className="btn btn-ghost btn-sm"
            disabled={updating !== null}
            style={{ fontSize: 11, padding: '6px 12px' }}
          >
            {updating === 'unequip' ? 'Removing…' : 'Unequip'}
          </button>
        )}
      </div>

      {/* List of achievements */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ACHIEVEMENTS_LIST.map(a => {
          const isUnlocked = unlockedTypes.has(a.type);
          const unlockInfo = achievements.find(item => item.achievement_type === a.type);
          const isEquipped = activeTitle === a.rewardTitle;

          return (
            <div
              key={a.type}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: '16px 20px',
                borderRadius: 12,
                background: isUnlocked ? 'rgba(255, 255, 255, 0.01)' : 'rgba(255, 255, 255, 0.003)',
                border: isUnlocked ? `1px solid rgba(255, 255, 255, 0.06)` : '1px dashed rgba(255, 255, 255, 0.03)',
                opacity: isUnlocked ? 1 : 0.6
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  fontSize: 26,
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: isUnlocked ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.005)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: isUnlocked ? `1px solid ${a.color}40` : '1px solid transparent',
                  boxShadow: isUnlocked ? `0 0 10px ${a.color}15` : 'none'
                }}>
                  {isUnlocked ? a.icon : '🔒'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {a.title}
                    {isUnlocked && (
                      <span className="badge" style={{ background: `${a.color}15`, color: a.color, fontSize: 10, padding: '1px 6px' }}>
                        Title: {a.rewardTitle}
                      </span>
                    )}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12.5, marginTop: 4, lineHeight: 1.4 }}>
                    {a.description}
                  </div>
                  {isUnlocked && unlockInfo?.unlocked_at && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                      Unlocked {new Date(unlockInfo.unlocked_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Equipping CTA */}
              {isUnlocked && (
                <div>
                  {isEquipped ? (
                    <span className="badge badge-indigo" style={{ fontSize: 11, padding: '6px 12px' }}>
                      Equipped
                    </span>
                  ) : (
                    <button
                      onClick={() => handleEquipTitle(a.rewardTitle)}
                      className="btn btn-ghost btn-sm"
                      disabled={updating !== null}
                      style={{ fontSize: 11, padding: '6px 12px' }}
                    >
                      {updating === a.rewardTitle ? 'Equipping…' : 'Equip Title'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
