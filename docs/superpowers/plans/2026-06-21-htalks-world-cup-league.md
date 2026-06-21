# HTalks Dünya Kupası Ligi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a World Cup prediction platform named "HTalks Dünya Kupası Ligi" using React, Tailwind CSS, and Supabase, featuring real-time odds-based scoring and a leaderboard.

**Architecture:** A single-page interactive dashboard (Approach A) containing a live-updating Leaderboard sidebar, an Upcoming Matches listing with prediction inputs, and a user Authentication card. Maç sonuçları ve oranları Supabase veritabanında güncellendiğinde, tetiklenen veya çalışan bir scoring modülü puanları hesaplar.

**Tech Stack:** React, TypeScript, Tailwind CSS, Supabase JS Client, Vitest (for TDD).

---

### Task 1: Environment and Dependencies Setup

**Files:**
- Modify: [package.json](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/package.json)
- Create: [.env.example](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/.env.example)
- Create: [tailwind.config.js](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/tailwind.config.js)
- Create: [postcss.config.js](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/postcss.config.js)
- Modify: [src/index.css](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/index.css)

- [ ] **Step 1: Install project dependencies**

Run:
```bash
npm install @supabase/supabase-js lucide-react
npm install -D tailwindcss postcss autoprefixer vitest
```

- [ ] **Step 2: Initialize Tailwind config**

Run:
```bash
npx tailwindcss init -p
```

- [ ] **Step 3: Configure tailwind.config.js**

Modify [tailwind.config.js](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/tailwind.config.js):
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#121214',
          card: '#1e1e24',
          accent: '#3b82f6',
          success: '#10b981',
          warning: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Update src/index.css with Tailwind directives**

Overwrite [src/index.css](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/index.css):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  background-color: #121214;
  color: #f3f4f6;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}
```

- [ ] **Step 5: Create .env.example file**

Create [.env.example](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/.env.example):
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_THE_ODDS_API_KEY=your_the_odds_api_key
```

- [ ] **Step 6: Commit changes**

Run:
```bash
git add package.json tailwind.config.js postcss.config.js src/index.css .env.example
git commit -m "chore: setup dependencies, Tailwind and .env.example"
```

---

### Task 2: Supabase Schema Definition

**Files:**
- Create: [supabase/migrations/20260621000000_init.sql](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/supabase/migrations/20260621000000_init.sql)

- [ ] **Step 1: Write SQL migration file for tables and RLS**

Create [supabase/migrations/20260621000000_init.sql](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/supabase/migrations/20260621000000_init.sql):
```sql
-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  total_points integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Matches Table
create table public.matches (
  id text primary key,
  home_team text not null,
  away_team text not null,
  commence_time timestamp with time zone not null,
  home_odd numeric not null,
  draw_odd numeric not null,
  away_odd numeric not null,
  status text not null default 'pending',
  home_score integer,
  away_score integer,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Predictions Table
create table public.predictions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_id text references public.matches(id) on delete cascade not null,
  predicted_outcome text not null check (predicted_outcome in ('home', 'draw', 'away')),
  predicted_diff integer not null,
  is_calculated boolean default false not null,
  earned_points integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, match_id)
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;

-- Profiles Policies
create policy "Allow public read on profiles" on public.profiles
  for select using (true);

create policy "Allow individual insert/update on profiles" on public.profiles
  for all using (auth.uid() = id);

-- Matches Policies
create policy "Allow public read on matches" on public.matches
  for select using (true);

-- Predictions Policies
create policy "Allow public read on predictions" on public.predictions
  for select using (true);

create policy "Allow individual predictions" on public.predictions
  for insert with check (auth.uid() = user_id);

create policy "Allow individual updates on open predictions" on public.predictions
  for update using (
    auth.uid() = user_id and 
    exists (
      select 1 from public.matches 
      where id = match_id and commence_time > now()
    )
  );
```

- [ ] **Step 2: Commit SQL migration**

Run:
```bash
git add supabase/migrations/20260621000000_init.sql
git commit -m "db: add database tables and RLS policy definitions"
```

---

### Task 3: TDD for Scoring Logic

**Files:**
- Create: [src/utils/scoring.ts](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/utils/scoring.ts)
- Create: [src/utils/scoring.test.ts](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/utils/scoring.test.ts)

- [ ] **Step 1: Write failing test for scoring calculations**

Create [src/utils/scoring.test.ts](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/utils/scoring.test.ts):
```typescript
import { describe, it, expect } from 'vitest';
import { calculateBasePoints, calculateMarginBonuses } from './scoring';

describe('Scoring Logic Tests', () => {
  describe('calculateBasePoints', () => {
    it('should return Math.round(odds * 10) for correct predictions', () => {
      expect(calculateBasePoints('home', 'home', 1.85)).toBe(19);
      expect(calculateBasePoints('draw', 'draw', 3.44)).toBe(34);
      expect(calculateBasePoints('away', 'away', 4.10)).toBe(41);
    });

    it('should return 0 for incorrect predictions', () => {
      expect(calculateBasePoints('home', 'draw', 1.85)).toBe(0);
      expect(calculateBasePoints('away', 'home', 4.10)).toBe(0);
    });
  });

  describe('calculateMarginBonuses', () => {
    it('should assign 1 bonus point to prediction(s) with the minimum absolute margin error', () => {
      const predictions = [
        { id: '1', predicted_diff: 2 },  // Error: |2 - 2| = 0
        { id: '2', predicted_diff: 1 },  // Error: |2 - 1| = 1
        { id: '3', predicted_diff: -1 }, // Error: |2 - (-1)| = 3
      ];
      const actualDiff = 2; // Home won by 2 goals
      const bonuses = calculateMarginBonuses(predictions, actualDiff);
      expect(bonuses['1']).toBe(1);
      expect(bonuses['2']).toBe(0);
      expect(bonuses['3']).toBe(0);
    });

    it('should share bonus points if multiple predictions are equally close', () => {
      const predictions = [
        { id: '1', predicted_diff: 1 },  // Error: |2 - 1| = 1
        { id: '2', predicted_diff: 3 },  // Error: |2 - 3| = 1
        { id: '3', predicted_diff: -2 }, // Error: |2 - (-2)| = 4
      ];
      const actualDiff = 2;
      const bonuses = calculateMarginBonuses(predictions, actualDiff);
      expect(bonuses['1']).toBe(1);
      expect(bonuses['2']).toBe(1);
      expect(bonuses['3']).toBe(0);
    });
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

Run:
```bash
npx vitest run src/utils/scoring.test.ts
```
Expected: FAIL due to missing imports/functions.

- [ ] **Step 3: Implement scoring calculations in src/utils/scoring.ts**

Create [src/utils/scoring.ts](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/utils/scoring.ts):
```typescript
export function calculateBasePoints(
  predictedOutcome: 'home' | 'draw' | 'away',
  actualOutcome: 'home' | 'draw' | 'away',
  odds: number
): number {
  if (predictedOutcome === actualOutcome) {
    return Math.round(odds * 10);
  }
  return 0;
}

interface BasicPrediction {
  id: string;
  predicted_diff: number;
}

export function calculateMarginBonuses(
  predictions: BasicPrediction[],
  actualDiff: number
): Record<string, number> {
  const result: Record<string, number> = {};
  if (predictions.length === 0) return result;

  // Calculate error for each prediction
  const errors = predictions.map(p => ({
    id: p.id,
    error: Math.abs(actualDiff - p.predicted_diff)
  }));

  // Find minimum error
  const minError = Math.min(...errors.map(e => e.error));

  // Award 1 point to closest, 0 to others
  for (const p of predictions) {
    const pError = Math.abs(actualDiff - p.predicted_diff);
    result[p.id] = pError === minError ? 1 : 0;
  }

  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npx vitest run src/utils/scoring.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit changes**

Run:
```bash
git add src/utils/scoring.ts src/utils/scoring.test.ts
git commit -m "feat: implement scoring module and verify with unit tests"
```

---

### Task 4: Supabase Connection Client

**Files:**
- Create: [src/lib/supabaseClient.ts](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/lib/supabaseClient.ts)

- [ ] **Step 1: Write Supabase client utility**

Create [src/lib/supabaseClient.ts](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/lib/supabaseClient.ts):
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 2: Commit Supabase client**

Run:
```bash
git add src/lib/supabaseClient.ts
git commit -m "feat: add Supabase JS client configuration"
```

---

### Task 5: The-Odds-API Integration and Mock Data Service

**Files:**
- Create: [src/utils/api.ts](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/utils/api.ts)

- [ ] **Step 1: Create mock matches generator and API fetching wrapper**

Create [src/utils/api.ts](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/utils/api.ts):
```typescript
export interface Match {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  home_odd: number;
  draw_odd: number;
  away_odd: number;
  status: 'pending' | 'completed';
  home_score?: number;
  away_score?: number;
}

export function generateMockMatches(): Match[] {
  const now = new Date();
  const day = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'mock-match-1',
      home_team: 'Arjantin',
      away_team: 'Fransa',
      commence_time: day(0), // Today
      home_odd: 2.10,
      draw_odd: 3.20,
      away_odd: 3.50,
      status: 'pending'
    },
    {
      id: 'mock-match-2',
      home_team: 'Brezilya',
      away_team: 'Almanya',
      commence_time: day(1), // Tomorrow
      home_odd: 1.85,
      draw_odd: 3.60,
      away_odd: 4.20,
      status: 'pending'
    },
    {
      id: 'mock-match-3',
      home_team: 'İspanya',
      away_team: 'İtalya',
      commence_time: day(2), // In 2 days
      home_odd: 2.30,
      draw_odd: 3.10,
      away_odd: 3.20,
      status: 'pending'
    }
  ];
}

export async function fetchMatchesFromAPI(apiKey: string): Promise<Match[]> {
  if (!apiKey) {
    return generateMockMatches();
  }

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/?apiKey=${apiKey}&regions=eu&markets=h2h`
    );
    if (!response.ok) {
      throw new Error('API fetch failed');
    }
    const data = await response.json();

    return data.map((item: any) => {
      const h2h = item.bookmakers?.[0]?.markets?.[0]?.outcomes || [];
      const homeOdd = h2h.find((o: any) => o.name === item.home_team)?.price || 2.0;
      const awayOdd = h2h.find((o: any) => o.name === item.away_team)?.price || 2.0;
      const drawOdd = h2h.find((o: any) => o.name === 'Draw')?.price || 3.0;

      return {
        id: item.id,
        home_team: item.home_team,
        away_team: item.away_team,
        commence_time: item.commence_time,
        home_odd: homeOdd,
        draw_odd: drawOdd,
        away_odd: awayOdd,
        status: 'pending'
      };
    });
  } catch (error) {
    console.error('API fetch failed, falling back to mock data:', error);
    return generateMockMatches();
  }
}
```

- [ ] **Step 2: Commit API integration**

Run:
```bash
git add src/utils/api.ts
git commit -m "feat: add mock match generator and API fetch integration wrapper"
```

---

### Task 6: Authentication Component

**Files:**
- Create: [src/components/Auth.tsx](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/components/Auth.tsx)

- [ ] **Step 1: Write Authentication component using Supabase auth**

Create [src/components/Auth.tsx](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/components/Auth.tsx):
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
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-brand-card p-6 rounded-xl border border-gray-800 shadow-xl max-w-md w-full mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-brand-accent">
        🏆 HTalks Dünya Kupası
      </h2>
      <form onSubmit={handleAuth} className="space-y-4">
        {isSignUp && (
          <div>
            <label className="block text-sm font-medium mb-1">Kullanıcı Adı</label>
            <input
              type="text"
              required
              className="w-full bg-brand-dark border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-accent"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">E-posta</label>
          <input
            type="email"
            required
            className="w-full bg-brand-dark border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-accent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Şifre</label>
          <input
            type="password"
            required
            className="w-full bg-brand-dark border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-accent"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-accent hover:bg-blue-600 transition-colors py-2.5 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? 'Yükleniyor...' : isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}
        </button>
      </form>
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-gray-400 hover:text-brand-accent transition-colors"
        >
          {isSignUp ? 'Zaten hesabınız var mı? Giriş Yapın' : 'Hesabınız yok mu? Kayıt Olun'}
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit Auth component**

Run:
```bash
git add src/components/Auth.tsx
git commit -m "feat: add Auth component for user register and login"
```

---

### Task 7: Leaderboard Component

**Files:**
- Create: [src/components/Leaderboard.tsx](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/components/Leaderboard.tsx)

- [ ] **Step 1: Write Leaderboard component showing users ordered by points**

Create [src/components/Leaderboard.tsx](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/components/Leaderboard.tsx):
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
    <div className="bg-brand-card rounded-xl border border-gray-800 p-5 shadow-xl">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span>🏆</span> Liderlik Tablosu
      </h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {users.map((user, idx) => {
          const isCurrentUser = user.id === currentUserId;
          return (
            <div
              key={user.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                isCurrentUser
                  ? 'bg-brand-accent/20 border-brand-accent font-semibold'
                  : 'bg-brand-dark/50 border-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold w-5 text-gray-400">
                  {idx + 1}.
                </span>
                <span className="text-sm">{user.username}</span>
              </div>
              <span className="text-sm font-bold text-brand-success">
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

- [ ] **Step 2: Commit Leaderboard component**

Run:
```bash
git add src/components/Leaderboard.tsx
git commit -m "feat: add Leaderboard component"
```

---

### Task 8: Match List and Predictions UI

**Files:**
- Create: [src/components/MatchList.tsx](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/components/MatchList.tsx)

- [ ] **Step 1: Write MatchCard and MatchList components with odds scoring display**

Create [src/components/MatchList.tsx](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/components/MatchList.tsx):
```tsx
import React, { useState } from 'react';
import { Match } from '../utils/api';

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
  const [diffInputs, setDiffInputs] = useState<Record<string, string>>({});

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
        <span>📅</span> Maç Fikstürü ve Oranlar
      </h3>
      {matches.map((match) => {
        const prediction = userPredictions[match.id];
        const inputDiff = diffInputs[match.id] || (prediction ? String(prediction.diff) : '');

        const handleOutcomeSelect = (outcome: 'home' | 'draw' | 'away') => {
          const diffVal = parseInt(inputDiff, 10) || 0;
          onPredict(match.id, outcome, diffVal);
        };

        const handleDiffChange = (val: string) => {
          setDiffInputs({ ...diffInputs, [match.id]: val });
          if (prediction) {
            const diffVal = parseInt(val, 10) || 0;
            onPredict(match.id, prediction.outcome, diffVal);
          }
        };

        return (
          <div key={match.id} className="bg-brand-card p-5 rounded-xl border border-gray-800 shadow-lg space-y-4">
            <div className="flex justify-between items-center text-sm text-gray-400">
              <span>⚽ Dünya Kupası</span>
              <span>{new Date(match.commence_time).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div className="flex justify-around items-center text-lg font-bold">
              <span>{match.home_team}</span>
              <span className="text-brand-accent">VS</span>
              <span>{match.away_team}</span>
            </div>

            {/* Odds / Prediction buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleOutcomeSelect('home')}
                className={`py-2 rounded-lg font-semibold border transition-all text-xs flex flex-col items-center ${
                  prediction?.outcome === 'home'
                    ? 'bg-brand-accent border-brand-accent text-white'
                    : 'bg-brand-dark border-gray-800 text-gray-300 hover:border-brand-accent'
                }`}
              >
                <span>{match.home_team}</span>
                <span className="opacity-80">Oran: {match.home_odd} ({Math.round(match.home_odd * 10)}p)</span>
              </button>
              <button
                onClick={() => handleOutcomeSelect('draw')}
                className={`py-2 rounded-lg font-semibold border transition-all text-xs flex flex-col items-center ${
                  prediction?.outcome === 'draw'
                    ? 'bg-brand-accent border-brand-accent text-white'
                    : 'bg-brand-dark border-gray-800 text-gray-300 hover:border-brand-accent'
                }`}
              >
                <span>Beraberlik</span>
                <span className="opacity-80">Oran: {match.draw_odd} ({Math.round(match.draw_odd * 10)}p)</span>
              </button>
              <button
                onClick={() => handleOutcomeSelect('away')}
                className={`py-2 rounded-lg font-semibold border transition-all text-xs flex flex-col items-center ${
                  prediction?.outcome === 'away'
                    ? 'bg-brand-accent border-brand-accent text-white'
                    : 'bg-brand-dark border-gray-800 text-gray-300 hover:border-brand-accent'
                }`}
              >
                <span>{match.away_team}</span>
                <span className="opacity-80">Oran: {match.away_odd} ({Math.round(match.away_odd * 10)}p)</span>
              </button>
            </div>

            {/* Goal Diff Input */}
            <div className="flex items-center gap-3 bg-brand-dark p-3 rounded-lg border border-gray-800">
              <label className="text-xs font-semibold text-gray-400 whitespace-nowrap">
                Fark Tahmini:
              </label>
              <input
                type="number"
                min="0"
                placeholder="Kazanan takım kaç gol fark atar?"
                className="w-full bg-transparent text-sm text-white focus:outline-none"
                value={inputDiff}
                onChange={(e) => handleDiffChange(e.target.value)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

- [ ] **Step 2: Commit MatchList UI component**

Run:
```bash
git add src/components/MatchList.tsx
git commit -m "feat: add MatchList with prediction and odds display"
```

---

### Task 9: Assemble Dashboard App

**Files:**
- Modify: [src/App.tsx](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/App.tsx)

- [ ] **Step 1: Write dynamic dashboard assembling the components**

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
  const [loading, setLoading] = useState(true);

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
    // Falls back to mock matches if key not supplied
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

    const newPrediction = { outcome, diff };
    setUserPredictions({ ...userPredictions, [matchId]: newPrediction });

    const { error } = await supabase.from('predictions').upsert(
      [
        {
          user_id: session.user.id,
          match_id: matchId,
          predicted_outcome: outcome,
          predicted_diff: diff,
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-brand-card border-b border-gray-800 py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold text-brand-success tracking-wide flex items-center gap-2">
          <span>🏆</span> HTalks Dünya Kupası Ligi
        </h1>
        {session?.user && userProfile && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold">{userProfile.username}</p>
              <p className="text-xs text-brand-success font-bold">{userProfile.total_points} Puan</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-xs bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              Çıkış Yap
            </button>
          </div>
        )}
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Main Column: Fixtures / Matches */}
        <div className="lg:col-span-2 space-y-6">
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

        {/* Right Column: Leaderboard */}
        <div className="space-y-6">
          <Leaderboard users={users} currentUserId={session?.user?.id} />
          
          {/* Rules/Info Panel */}
          <div className="bg-brand-card rounded-xl border border-gray-800 p-5 shadow-xl text-sm space-y-3">
            <h4 className="font-bold text-gray-200">ℹ️ Kurallar & Puanlama</h4>
            <ul className="list-disc list-inside space-y-1.5 text-gray-400">
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

- [ ] **Step 2: Commit Dashboard App assembly**

Run:
```bash
git add src/App.tsx
git commit -m "feat: assemble app dashboard with profiles, matches, and prediction state"
```

---

### Task 10: Manual Verification & Build Validation

**Files:**
- Create: [docs/superpowers/walkthroughs/walkthrough.md](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/docs/superpowers/walkthroughs/walkthrough.md)

- [ ] **Step 1: Check React local build**

Run:
```bash
npm run build
```
Expected: Compiles with 0 build errors.

- [ ] **Step 2: Document Walkthrough**

Create [docs/superpowers/walkthroughs/walkthrough.md](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/docs/superpowers/walkthroughs/walkthrough.md):
```markdown
# Walkthrough - HTalks Dünya Kupası Ligi

Tüm gereksinimler doğrultusunda "HTalks Dünya Kupası Ligi" projesinin ilk versiyonu başarıyla tamamlanmıştır.

## Gerçekleştirilen İşler
1. **Veri Modeli:** `profiles`, `matches` ve `predictions` tabloları Supabase/Postgres veritabanında yapılandırıldı. RLS güvenlik kuralları tanımlandı.
2. **Dinamik Puanlama:** Kazanan oranının 10 katı tam sayı puanı ile en yakın farkı tahmin edene +1 puan veren algoritmalar geliştirildi ve birim testlerle doğrulandı.
3. **Arayüz (Dashboard):** React & Tailwind tabanlı, Liderlik Tablosunu ve Tahmin alanlarını birleştiren modern tek ekran (Approach A) arayüzü kuruldu.
```

- [ ] **Step 3: Commit Walkthrough**

Run:
```bash
git add docs/superpowers/walkthroughs/walkthrough.md
git commit -m "docs: add development walkthrough document"
```
