# HTalks Dünya Kupası Ligi Premium UI Overhaul Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the entire visual styling of the predictor league platform to match the premium, glassmorphic dark theme concept featuring deep obsidian backgrounds, neon glowing effects, and clean responsive grids.

**Architecture:** Update Tailwind configuration for custom glowing shadows. Restyle the index.css variables with deep indigo-violet gradients. Completely upgrade components (Auth, Leaderboard, PredictionCard, and App) to implement premium designs, responsive card grids, and smooth animations.

**Tech Stack:** React, Tailwind CSS, Lucide Icons.

---

### Task 1: Update Tailwind Config and Global Styles

**Files:**
- Modify: [tailwind.config.js](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/tailwind.config.js)
- Modify: [src/index.css](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/index.css)

- [ ] **Step 1: Configure custom glow shadows and presets in tailwind.config.js**

Modify [tailwind.config.js](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/tailwind.config.js):
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "rgba(255, 255, 255, 0.08)",
        input: "rgba(255, 255, 255, 0.05)",
        background: "#030014",
        foreground: "#f4f4f5",
        brand: {
          dark: '#0c0a18',
          card: 'rgba(12, 10, 24, 0.65)',
          accent: '#8b5cf6',
          success: '#10b981',
          warning: '#f59e0b',
        }
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(139, 92, 246, 0.35)',
        'glow-success': '0 0 25px -5px rgba(16, 185, 129, 0.35)',
        'glow-accent': '0 0 25px -5px rgba(59, 130, 246, 0.35)',
      }
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Apply custom background radial gradient and base configurations in src/index.css**

Overwrite [src/index.css](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/index.css):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  background: radial-gradient(circle at 50% 0%, #160c33 0%, #030014 70%);
  color: #f4f4f5;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  min-height: 100vh;
}

/* Glassmorphism custom panel styles */
.glass-panel {
  background: rgba(12, 10, 24, 0.65);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.neon-border:hover {
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.15);
}
```

- [ ] **Step 3: Commit styles configuration**

Run:
```bash
git add tailwind.config.js src/index.css
git commit -m "style: configure premium theme variables and background gradients"
```

---

### Task 2: Refactor Auth Component to Glassmorphic Style

**Files:**
- Modify: [src/components/Auth.tsx](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/components/Auth.tsx)

- [ ] **Step 1: Rewrite Auth component with glassmorphic cards and glows**

Overwrite [src/components/Auth.tsx](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/components/Auth.tsx):
```tsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AuthProps {
  onAuthSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: data.user.id, username, total_points: 0 }]);
          if (profileError) throw profileError;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
      onAuthSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-8 rounded-2xl shadow-glow max-w-md w-full mx-auto border border-white/10 relative overflow-hidden">
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-violet-600/10 blur-3xl rounded-full"></div>
      <h2 className="text-3xl font-extrabold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400 font-mono tracking-wide">
        🏆 HTALKS ARENA
      </h2>
      <form onSubmit={handleAuth} className="space-y-4">
        {isSignUp && (
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-1">Kullanıcı Adı</label>
            <input
              type="text"
              required
              className="w-full bg-black/40 border border-white/10 hover:border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-mono"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        )}
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-1">E-posta</label>
          <input
            type="email"
            required
            className="w-full bg-black/40 border border-white/10 hover:border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-mono"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-1">Şifre</label>
          <input
            type="password"
            required
            className="w-full bg-black/40 border border-white/10 hover:border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-mono"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all py-3.5 rounded-xl font-bold text-white shadow-glow disabled:opacity-50 hover:-translate-y-0.5"
        >
          {loading ? 'Yükleniyor...' : isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}
        </button>
      </form>
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-xs text-zinc-400 hover:text-violet-400 transition-colors"
        >
          {isSignUp ? 'Zaten hesabınız var mı? Giriş Yapın' : 'Hesabınız yok mu? Kayıt Olun'}
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit Auth restyling**

Run:
```bash
git add src/components/Auth.tsx
git commit -m "style: redesign Auth component with premium glassmorphism card"
```

---

### Task 3: Refactor Leaderboard Component

**Files:**
- Modify: [src/components/Leaderboard.tsx](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/components/Leaderboard.tsx)

- [ ] **Step 1: Rewrite Leaderboard component with custom rank badges**

Overwrite [src/components/Leaderboard.tsx](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/components/Leaderboard.tsx):
```tsx
import React from 'react';

export interface LeaderboardUser {
  id: string;
  username: string;
  total_points: number;
}

interface LeaderboardProps {
  users: LeaderboardUser[];
  currentUserId?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ users, currentUserId }) => {
  return (
    <div className="glass-panel rounded-2xl p-6 shadow-2xl relative overflow-hidden border border-white/5">
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-violet-500/10 blur-3xl rounded-full"></div>
      <h3 className="text-sm font-bold tracking-wider font-mono mb-4 text-zinc-300 flex items-center gap-2 uppercase">
        <span>🏆</span> LİDERLİK TABLOSU
      </h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {users.map((user, idx) => {
          const isCurrentUser = user.id === currentUserId;
          const rank = idx + 1;
          
          let rankBadge = (
            <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-400 font-bold font-mono text-xs flex items-center justify-center">
              {rank}
            </span>
          );
          let itemStyle = "bg-zinc-900/30 border-zinc-900/50";

          if (rank === 1) {
            rankBadge = (
              <span className="w-6 h-6 rounded-lg bg-amber-500 text-black font-bold font-mono text-xs flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                1
              </span>
            );
            itemStyle = "bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-amber-500/25";
          } else if (rank === 2) {
            rankBadge = (
              <span className="w-6 h-6 rounded-lg bg-zinc-300 text-black font-bold font-mono text-xs flex items-center justify-center shadow-[0_0_12px_rgba(224,224,224,0.4)]">
                2
              </span>
            );
            itemStyle = "bg-gradient-to-r from-zinc-300/10 to-zinc-400/5 border-zinc-300/25";
          } else if (rank === 3) {
            rankBadge = (
              <span className="w-6 h-6 rounded-lg bg-amber-700 text-white font-bold font-mono text-xs flex items-center justify-center">
                3
              </span>
            );
            itemStyle = "bg-gradient-to-r from-amber-700/15 to-amber-800/5 border-amber-700/25";
          }

          if (isCurrentUser) {
            itemStyle = "bg-gradient-to-r from-violet-600/20 to-indigo-600/10 border-violet-500/50 shadow-glow";
          }

          return (
            <div
              key={user.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${itemStyle}`}
            >
              <div className="flex items-center gap-3">
                {rankBadge}
                <span className="text-sm font-semibold">{user.username} {isCurrentUser && <span className="text-[10px] text-violet-400 font-mono">(SEN)</span>}</span>
              </div>
              <span className="text-sm font-bold text-zinc-200 font-mono">
                {user.total_points} Puan
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit Leaderboard changes**

Run:
```bash
git add src/components/Leaderboard.tsx
git commit -m "style: upgrade Leaderboard component with gold/silver/bronze badges"
```

---

### Task 4: Refactor PredictionCard and MatchList

**Files:**
- Modify: [src/components/PredictionCard.tsx](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/components/PredictionCard.tsx)
- Modify: [src/components/MatchList.tsx](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/components/MatchList.tsx)

- [ ] **Step 1: Rewrite PredictionCard to support circular country flags and glassmorphic inputs**

Overwrite [src/components/PredictionCard.tsx](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/components/PredictionCard.tsx):
```tsx
import React, { useState } from 'react';

export interface MatchData {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  home_odd: number;
  draw_odd: number;
  away_odd: number;
  home_score?: number;
  away_score?: number;
  status?: string;
}

interface PredictionCardProps {
  match: MatchData;
  initialPrediction?: { outcome: 'home' | 'draw' | 'away'; diff: number };
  onPredict: (matchId: string, outcome: 'home' | 'draw' | 'away', diff: number) => void;
}

const getFlagEmoji = (countryName: string): string => {
  const flags: Record<string, string> = {
    'Arjantin': '🇦🇷',
    'Fransa': '🇫🇷',
    'Brezilya': '🇧🇷',
    'Almanya': '🇩🇪',
    'İspanya': '🇪🇸',
    'İtalya': '🇮🇹',
    'Kamerun': '🇨🇲',
  };
  return flags[countryName] || '🏳️';
};

export const PredictionCard: React.FC<PredictionCardProps> = ({
  match,
  initialPrediction,
  onPredict,
}) => {
  const [outcome, setOutcome] = useState<'home' | 'draw' | 'away' | null>(
    initialPrediction?.outcome || null
  );
  const [diff, setDiff] = useState<string>(
    initialPrediction ? String(initialPrediction.diff) : ''
  );

  const handleSelectOutcome = (selected: 'home' | 'draw' | 'away') => {
    setOutcome(selected);
    const diffVal = selected === 'draw' ? 0 : (parseInt(diff, 10) || 0);
    if (selected === 'draw') setDiff('0');
    onPredict(match.id, selected, diffVal);
  };

  const handleDiffChange = (val: string) => {
    setDiff(val);
    if (outcome) {
      const diffVal = outcome === 'draw' ? 0 : (parseInt(val, 10) || 0);
      onPredict(match.id, outcome, diffVal);
    }
  };

  const formattedDate = new Date(match.commence_time).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isCompleted = match.status === 'completed';

  return (
    <div className={`glass-panel p-6 rounded-2xl shadow-xl transition-all duration-300 neon-border relative overflow-hidden ${
      isCompleted ? 'border-l-4 border-l-emerald-500 shadow-glow-success' : ''
    }`}>
      {/* Live / Upcoming Badge */}
      <div className="absolute top-4 right-6">
        {isCompleted ? (
          <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider font-mono">
            TAMAMLANDI
          </span>
        ) : (
          <span className="flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider font-mono">
            BAŞLAMADI
          </span>
        )}
      </div>

      <div className="text-[10px] text-zinc-500 tracking-widest uppercase font-mono mb-2">⚽ fıfa world cup</div>

      {/* Teams Display Row */}
      <div className="flex justify-between items-center my-4 gap-4 border-y border-white/5 py-4">
        <div className="flex flex-col items-center flex-1">
          <div className="w-16 h-12 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden shadow-inner mb-2 text-3xl">
            {getFlagEmoji(match.home_team)}
          </div>
          <span className="text-xs font-bold tracking-wider uppercase text-zinc-300">{match.home_team}</span>
        </div>
        
        <div className="flex flex-col items-center">
          {isCompleted ? (
            <div className="text-xl font-mono font-bold bg-white/5 px-4 py-1.5 rounded-xl border border-white/5">
              {match.home_score} - {match.away_score}
            </div>
          ) : (
            <span className="text-[10px] font-mono font-semibold text-zinc-500 tracking-widest px-3 py-1 bg-white/5 rounded-full border border-white/5 uppercase">
              vs
            </span>
          )}
        </div>

        <div className="flex flex-col items-center flex-1">
          <div className="w-16 h-12 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden shadow-inner mb-2 text-3xl">
            {getFlagEmoji(match.away_team)}
          </div>
          <span className="text-xs font-bold tracking-wider uppercase text-zinc-300">{match.away_team}</span>
        </div>
      </div>

      {/* 1X2 Outcome Selector (Hide if completed, show prediction result instead) */}
      {!isCompleted ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleSelectOutcome('home')}
              className={`py-3 px-2 rounded-xl border transition-all text-xs flex flex-col items-center ${
                outcome === 'home'
                  ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 border-violet-500 text-white font-bold shadow-glow'
                  : 'bg-black/20 border-white/5 text-zinc-400 hover:border-violet-500/40 hover:text-zinc-200'
              }`}
            >
              <span className="truncate max-w-full font-mono text-[10px]">{match.home_team}</span>
              <span className="text-[10px] opacity-80 mt-1">{match.home_odd} (x10p)</span>
            </button>
            
            <button
              onClick={() => handleSelectOutcome('draw')}
              className={`py-3 px-2 rounded-xl border transition-all text-xs flex flex-col items-center ${
                outcome === 'draw'
                  ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 border-violet-500 text-white font-bold shadow-glow'
                  : 'bg-black/20 border-white/5 text-zinc-400 hover:border-violet-500/40 hover:text-zinc-200'
              }`}
            >
              <span className="font-mono text-[10px]">BERABERLİK</span>
              <span className="text-[10px] opacity-80 mt-1">{match.draw_odd} (x10p)</span>
            </button>

            <button
              onClick={() => handleSelectOutcome('away')}
              className={`py-3 px-2 rounded-xl border transition-all text-xs flex flex-col items-center ${
                outcome === 'away'
                  ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 border-violet-500 text-white font-bold shadow-glow'
                  : 'bg-black/20 border-white/5 text-zinc-400 hover:border-violet-500/40 hover:text-zinc-200'
              }`}
            >
              <span className="truncate max-w-full font-mono text-[10px]">{match.away_team}</span>
              <span className="text-[10px] opacity-80 mt-1">{match.away_odd} (x10p)</span>
            </button>
          </div>

          {/* Goal Difference Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-black/20 p-4 rounded-xl border border-white/5">
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider font-mono">
                GOL FARKI TAHMİNİ
              </label>
              <span className="text-[9px] text-zinc-500 font-sans block">Kazanan takımın atacağı fark.</span>
            </div>
            <input
              type="number"
              min="0"
              disabled={outcome === 'draw'}
              placeholder={outcome === 'draw' ? '0 (Beraberlik)' : 'Fark girin (Örn: 2)'}
              className="bg-black/40 border border-white/10 hover:border-white/20 focus:border-violet-500 focus:outline-none rounded-lg px-4 py-2 text-sm text-center font-mono w-full text-white disabled:opacity-40"
              value={diff}
              onChange={(e) => handleDiffChange(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="mt-4 flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
          <div className="text-xs text-zinc-400">
            Tahminin: <strong className="text-violet-400 uppercase font-mono">{outcome === 'home' ? match.home_team : outcome === 'away' ? match.away_team : 'Beraberlik'} • {diff} Fark</strong>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md font-mono font-bold uppercase tracking-wider">
            Sonuçlandı
          </span>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Clean up old MatchList UI component and reference the new PredictionCard**

Overwrite [src/components/MatchList.tsx](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/components/MatchList.tsx):
```tsx
import React from 'react';
import { Match } from '../utils/api';
import { PredictionCard } from './PredictionCard';

interface MatchListProps {
  matches: Match[];
  userPredictions: Record<string, { outcome: 'home' | 'draw' | 'away'; diff: number }>;
  onPredict: (matchId: string, outcome: 'home' | 'draw' | 'away', diff: number) => void;
}

export const MatchList: React.FC<MatchListProps> = ({
  matches,
  userPredictions,
  onPredict,
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 font-mono tracking-wider uppercase text-zinc-300">
        <span>📅</span> GÜNCEL TAHMİN ARENASI
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {matches.map((match) => (
          <PredictionCard
            key={match.id}
            match={match}
            initialPrediction={userPredictions[match.id]}
            onPredict={onPredict}
          />
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Commit MatchList and PredictionCard updates**

Run:
```bash
git add src/components/PredictionCard.tsx src/components/MatchList.tsx
git commit -m "style: overhaul MatchList and PredictionCard components to glowing glassmorphic style"
```

---

### Task 5: Upgrade Main App Layout

**Files:**
- Modify: [src/App.tsx](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/App.tsx)

- [ ] **Step 1: Restyle the main dashboard App.tsx**

Overwrite [src/App.tsx](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/App.tsx):
```tsx
import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { Auth } from './components/Auth';
import { Leaderboard, LeaderboardUser } from './components/Leaderboard';
import { MatchList } from './components/MatchList';
import { fetchMatchesFromAPI, Match } from './utils/api';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [userPredictions, setUserPredictions] = useState<Record<string, { outcome: 'home' | 'draw' | 'away'; diff: number }>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile();
      fetchPredictions();
    } else {
      setUserProfile(null);
      setUserPredictions({});
    }
  }, [session]);

  useEffect(() => {
    fetchLeaderboard();
    loadMatches();
  }, []);

  const fetchUserProfile = async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    if (data) setUserProfile(data);
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, total_points')
      .order('total_points', { ascending: false });
    if (data) setUsers(data);
  };

  const loadMatches = async () => {
    const apiKey = import.meta.env.VITE_THE_ODDS_API_KEY || '';
    const items = await fetchMatchesFromAPI(apiKey);
    setMatches(items);
  };

  const fetchPredictions = async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from('predictions')
      .select('match_id, predicted_outcome, predicted_diff')
      .eq('user_id', session.user.id);

    if (data) {
      const preds: Record<string, { outcome: 'home' | 'draw' | 'away'; diff: number }> = {};
      data.forEach((p) => {
        preds[p.match_id] = { outcome: p.predicted_outcome as any, diff: p.predicted_diff };
      });
      setUserPredictions(preds);
    }
  };

  const handlePredict = async (matchId: string, outcome: 'home' | 'draw' | 'away', diff: number) => {
    if (!session?.user || !userProfile) return;

    // Convert raw positive input difference to signed difference:
    // positive for home win, negative for away win, 0 for draw
    let signedDiff = diff;
    if (outcome === 'away') {
      signedDiff = -Math.abs(diff);
    } else if (outcome === 'draw') {
      signedDiff = 0;
    }

    const newPrediction = { outcome, diff: signedDiff };
    setUserPredictions({ ...userPredictions, [matchId]: newPrediction });

    const { error } = await supabase.from('predictions').upsert(
      [
        {
          user_id: session.user.id,
          match_id: matchId,
          predicted_outcome: outcome,
          predicted_diff: signedDiff,
        },
      ],
      { onConflict: 'user_id,match_id' }
    );

    if (error) {
      console.error('Tahmin kaydedilemedi:', error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-violet-600/30 selection:text-white">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center shadow-lg">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-glow">
            <span class="text-xl font-bold tracking-wider text-white font-mono">🏆</span>
          </div>
          <div>
            <h1 class="text-lg font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400 font-mono">
              HTalks Dünya Kupası Ligi
            </h1>
            <p class="text-[10px] text-zinc-500 uppercase tracking-widest">Premium Arena v2.0</p>
          </div>
        </div>
        {session?.user && userProfile && (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{userProfile.username}</p>
              <p className="text-xs text-emerald-400 font-bold font-mono">{userProfile.total_points} Puan</p>
            </div>
            <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
            <button
              onClick={handleSignOut}
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-xs font-semibold px-4 py-2 rounded-lg font-mono tracking-wider"
            >
              ÇIKIŞ YAP
            </button>
          </div>
        )}
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* Left Column: Fixtures / Matches (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {!session ? (
            <div className="py-12 flex justify-center">
              <Auth onAuthSuccess={fetchUserProfile} />
            </div>
          ) : (
            <MatchList
              matches={matches}
              userPredictions={userPredictions}
              onPredict={handlePredict}
            />
          )}
        </div>

        {/* Right Column: Leaderboard (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Leaderboard users={users} currentUserId={session?.user?.id} />
          
          {/* Rules/Info Panel */}
          <div className="glass-panel rounded-2xl p-6 shadow-2xl border border-white/5 text-sm space-y-3">
            <h4 className="font-bold text-gray-200 font-mono tracking-wide uppercase">ℹ️ Kurallar & Puanlama</h4>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-400 text-xs leading-relaxed">
              <li>Doğru kazanan (1X2) tahmini: <strong>Bahis Oranı x 10 Puan</strong> (Yuvarlanır).</li>
              <li>Maçın gol farkını en yakın tahmin eden kullanıcı(lar) <strong>+1 Bonus Puan</strong> kazanır.</li>
              <li>Tahminler maç başlangıç saatine kadar değiştirilebilir.</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
```

- [ ] **Step 2: Commit App overhaul**

Run:
```bash
git add src/App.tsx
git commit -m "style: overhaul main App layout with glassmorphic top header and 12-column grid"
```

---

### Task 6: Final Verification & Build Check

**Files:**
- None

- [ ] **Step 1: Check production build compiles clean**

Run:
```bash
npm run build
```
Expected: Compiles with 0 build errors.
