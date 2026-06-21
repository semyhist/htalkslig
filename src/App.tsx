/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { Auth } from './components/Auth';
import { Leaderboard } from './components/Leaderboard';
import type { LeaderboardUser } from './components/Leaderboard';
import { MatchList } from './components/MatchList';
import { fetchMatchesFromAPI } from './utils/api';
import type { Match } from './utils/api';
import type { Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  username: string;
  total_points: number;
}

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setUserProfile(data as UserProfile);
  };

  const fetchPredictions = async (userId: string) => {
    const { data } = await supabase
      .from('predictions')
      .select('match_id, predicted_outcome, predicted_diff')
      .eq('user_id', userId);

    if (data) {
      const preds: Record<string, { outcome: 'home' | 'draw' | 'away'; diff: number }> = {};
      data.forEach((p) => {
        preds[p.match_id] = { outcome: p.predicted_outcome as 'home' | 'draw' | 'away', diff: p.predicted_diff };
      });
      setUserPredictions(preds);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile(session.user.id);
      fetchPredictions(session.user.id);
    } else {
      setUserProfile(null);
      setUserPredictions({});
    }
  }, [session]);

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, total_points')
      .order('total_points', { ascending: false });
    if (data) setUsers(data as LeaderboardUser[]);
  };

  const loadMatches = async () => {
    const apiKey = import.meta.env.VITE_THE_ODDS_API_KEY || '';
    const items = await fetchMatchesFromAPI(apiKey);
    setMatches(items);
  };

  useEffect(() => {
    fetchLeaderboard();
    loadMatches();
  }, []);

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

  const handleAuthSuccess = () => {
    if (session?.user) {
      fetchUserProfile(session.user.id);
    }
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
              <Auth onAuthSuccess={handleAuthSuccess} />
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
