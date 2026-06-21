import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { Auth } from './components/Auth';
import { Leaderboard } from './components/Leaderboard';
import type { LeaderboardUser } from './components/Leaderboard';
import { MatchList } from './components/MatchList';
import { fetchMatchesFromAPI } from './utils/api';
import type { Match } from './utils/api';

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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-glow">
            <span className="text-xl font-bold tracking-wider text-white font-mono">🏆</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400 font-mono">
              HTalks Dünya Kupası Ligi
            </h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Premium Arena v2.0</p>
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
