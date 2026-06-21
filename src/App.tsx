import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { Auth } from './components/Auth';
import { Leaderboard } from './components/Leaderboard';
import type { LeaderboardUser } from './components/Leaderboard';
import { MatchList } from './components/MatchList';
import { fetchMatchesFromAPI, fetchScoresFromAPI } from './utils/api';
import type { Match } from './utils/api';
import { Trophy, Info, LogOut, AlertTriangle, RefreshCw, User } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [userPredictions, setUserPredictions] = useState<Record<string, { outcome: 'home' | 'draw' | 'away'; diff: number }>>({});
  const [dbError, setDbError] = useState<string | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchTab, setMatchTab] = useState<'active' | 'completed'>('active');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const isActive = sessionStorage.getItem('is_active_session');
        const rememberMe = localStorage.getItem('remember_me');
        if (!isActive && rememberMe !== 'true') {
          await supabase.auth.signOut();
          setSession(null);
          return;
        }
        sessionStorage.setItem('is_active_session', 'true');
      }
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const isActive = sessionStorage.getItem('is_active_session');
        const rememberMe = localStorage.getItem('remember_me');
        if (!isActive && rememberMe !== 'true') {
          await supabase.auth.signOut();
          setSession(null);
          return;
        }
        sessionStorage.setItem('is_active_session', 'true');
      }
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

  useEffect(() => {
    if (session?.user && matches.length > 0) {
      calculatePendingPoints(session.user.id);
    }
  }, [session, matches]);

  const fetchUserProfile = async () => {
    if (!session?.user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle(); // .single() yerine: profil yoksa null döndürür, hata fırlatmaz

      if (error) throw error;

      if (data) {
        setUserProfile(data);
      } else {
        // Profil yok — oluşturmayı dene (trigger başarısız olmuş olabilir)
        const username =
          session.user.user_metadata?.username ||
          'user_' + session.user.id.slice(0, 8);

        const { data: created, error: createErr } = await supabase
          .from('profiles')
          .upsert([{ id: session.user.id, username, total_points: 0 }], { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (createErr) {
          console.error('Profile auto-create error:', createErr);
        } else if (created) {
          setUserProfile(created);
        }
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select('id, username, total_points')
        .order('total_points', { ascending: false });

      if (error) {
        console.error('Leaderboard fetch error:', error);
        if (status === 404 || error.message?.includes('profiles') || error.message?.includes('does not exist')) {
          setDbError('Supabase veritabanı tabloları bulunamadı. Lütfen "supabase/migrations/20260621000000_init.sql" içerisindeki şemayı Supabase SQL Editor\'de çalıştırın.');
        } else {
          setDbError('Veritabanına bağlanılamadı: ' + error.message);
        }
      } else {
        setDbError(null);
        if (data) setUsers(data);
      }
    } catch (err: any) {
      console.error('Catch error fetching leaderboard:', err);
    }
  };

  // Puan hesaplama sunucu tarafında (SECURITY DEFINER) Postgres fonksiyonu
  // üzerinden yapılır. Client artık total_points'i doğrudan yazamaz.
  const calculatePendingPoints = async (currentUserId: string) => {
    try {
      const { data: earned, error } = await supabase.rpc('calculate_user_points', {
        p_user_id: currentUserId,
      });
      if (error) {
        // Fonksiyon henüz kurulmamışsa sessizce devam et
        console.warn('calculate_user_points RPC error (migration çalıştırıldı mı?):', error.message);
        return;
      }
      if (earned && earned > 0) {
        fetchUserProfile();
        fetchLeaderboard();
      }
    } catch (err) {
      console.error('Error in calculatePendingPoints:', err);
    }
  };

  const loadMatches = async () => {
    setLoadingMatches(true);
    try {
      const apiKey = import.meta.env.VITE_THE_ODDS_API_KEY || '';

      // 1. Fetch matches from database first
      let { data: dbMatches, error: dbError } = await supabase
        .from('matches')
        .select('*')
        .order('commence_time', { ascending: true });

      if (dbError) {
        console.warn('Matches table read error:', dbError);
        const apiMatches = await fetchMatchesFromAPI(apiKey);
        setMatches(apiMatches);
        return;
      }

      // Clean up mock matches from database if any exist
      const hasMockMatches = dbMatches?.some(m => m.id.startsWith('mock-'));
      if (hasMockMatches) {
        const { error: deleteError } = await supabase
          .from('matches')
          .delete()
          .like('id', 'mock-%');
        if (!deleteError) {
          const { data: refreshedMatches } = await supabase
            .from('matches')
            .select('*')
            .order('commence_time', { ascending: true });
          dbMatches = refreshedMatches;
        }
      }

      // 2. Decide if we need to sync with the external API
      let shouldSync = false;

      if (!dbMatches || dbMatches.length === 0) {
        shouldSync = true;
      } else {
        const lastUpdated = Math.max(...dbMatches.map(m => new Date(m.updated_at || 0).getTime()));
        const timeSinceLastUpdate = Date.now() - lastUpdated;
        const cooldownPeriod = 4 * 60 * 60 * 1000; // 4 hours cache cooldown
        
        if (timeSinceLastUpdate > cooldownPeriod) {
          shouldSync = true;
        }
      }

      let finalMatchesList = dbMatches || [];

      // 3. If we should sync, fetch matches and scores and sync
      if (shouldSync) {
        const [apiMatches, apiScores] = await Promise.all([
          fetchMatchesFromAPI(apiKey),
          fetchScoresFromAPI(apiKey)
        ]);

        const { data: { session: activeSession } } = await supabase.auth.getSession();
        
        if (activeSession?.user && (apiMatches.length > 0 || apiScores.length > 0)) {
          const dbMatchMap = new Map(dbMatches?.map(m => [m.id, m]));
          const rowsToUpsert = [];

          for (const apiM of apiMatches) {
            const existing = dbMatchMap.get(apiM.id);
            const scoreItem = apiScores.find(s => s.id === apiM.id);
            const isCompleted = scoreItem?.completed || false;
            
            let homeScore: number | undefined = undefined;
            let awayScore: number | undefined = undefined;
            if (scoreItem?.scores) {
              const hScore = scoreItem.scores.find(s => s.name === apiM.home_team)?.score;
              const aScore = scoreItem.scores.find(s => s.name === apiM.away_team)?.score;
              if (hScore !== undefined) homeScore = parseInt(hScore, 10);
              if (aScore !== undefined) awayScore = parseInt(aScore, 10);
            }

            const status = isCompleted ? 'completed' : 'pending';

            if (!existing) {
              rowsToUpsert.push({
                id: apiM.id,
                home_team: apiM.home_team,
                away_team: apiM.away_team,
                commence_time: apiM.commence_time,
                home_odd: apiM.home_odd,
                draw_odd: apiM.draw_odd,
                away_odd: apiM.away_odd,
                status: status,
                home_score: homeScore,
                away_score: awayScore
              });
            } else {
              const statusChanged = existing.status !== status;
              const scoreChanged = existing.home_score !== homeScore || existing.away_score !== awayScore;
              
              if (existing.status === 'pending' || statusChanged || scoreChanged) {
                rowsToUpsert.push({
                  id: apiM.id,
                  home_team: apiM.home_team,
                  away_team: apiM.away_team,
                  commence_time: apiM.commence_time,
                  home_odd: apiM.home_odd,
                  draw_odd: apiM.draw_odd,
                  away_odd: apiM.away_odd,
                  status: status,
                  home_score: homeScore !== undefined ? homeScore : existing.home_score,
                  away_score: awayScore !== undefined ? awayScore : existing.away_score
                });
              }
            }
          }

          for (const scoreItem of apiScores) {
            const existing = dbMatchMap.get(scoreItem.id);
            if (existing && scoreItem.completed && existing.status === 'pending') {
              let homeScore: number | undefined = undefined;
              let awayScore: number | undefined = undefined;
              if (scoreItem.scores) {
                const hScore = scoreItem.scores.find(s => s.name === existing.home_team)?.score;
                const aScore = scoreItem.scores.find(s => s.name === existing.away_team)?.score;
                if (hScore !== undefined) homeScore = parseInt(hScore, 10);
                if (aScore !== undefined) awayScore = parseInt(aScore, 10);
              }

              rowsToUpsert.push({
                id: existing.id,
                home_team: existing.home_team,
                away_team: existing.away_team,
                commence_time: existing.commence_time,
                home_odd: existing.home_odd,
                draw_odd: existing.draw_odd,
                away_odd: existing.away_odd,
                status: 'completed',
                home_score: homeScore !== undefined ? homeScore : existing.home_score,
                away_score: awayScore !== undefined ? awayScore : existing.away_score
              });
            }
          }

          if (rowsToUpsert.length > 0) {
            // Yeni maçlar için önce INSERT (odds dahil)
            const newMatches = rowsToUpsert.filter((r: any) => !dbMatchMap.has(r.id));
            const existingMatches = rowsToUpsert.filter((r: any) => dbMatchMap.has(r.id));

            if (newMatches.length > 0) {
              const { error: insertErr } = await supabase
                .from('matches')
                .upsert(newMatches, { onConflict: 'id' });
              if (insertErr) console.error('Error inserting new matches:', insertErr);
            }

            // Mevcut maçlar için skor/durum güncellemesi → SECURITY DEFINER RPC
            for (const row of existingMatches) {
              if (row.status === 'completed' || row.home_score !== undefined) {
                const { error: syncErr } = await supabase.rpc('sync_match_score', {
                  p_match_id: row.id,
                  p_status: row.status,
                  p_home_score: row.home_score ?? null,
                  p_away_score: row.away_score ?? null,
                });
                if (syncErr) console.warn('sync_match_score RPC error:', syncErr.message);
              } else {
                // Sadece odds güncellemesi → normal UPDATE
                const { error: oddsErr } = await supabase
                  .from('matches')
                  .update({
                    home_odd: row.home_odd,
                    draw_odd: row.draw_odd,
                    away_odd: row.away_odd,
                  })
                  .eq('id', row.id);
                if (oddsErr) console.warn('Odds update error:', oddsErr.message);
              }
            }
          }

          const { data: refreshedMatches } = await supabase
            .from('matches')
            .select('*')
            .order('commence_time', { ascending: true });
          
          if (refreshedMatches && refreshedMatches.length > 0) {
            finalMatchesList = refreshedMatches;
          }
        }
      }

      setMatches(finalMatchesList as Match[]);
    } catch (err: any) {
      console.error('Error in loadMatches flow:', err);
      const apiKey = import.meta.env.VITE_THE_ODDS_API_KEY || '';
      const items = await fetchMatchesFromAPI(apiKey);
      setMatches(items);
    } finally {
      setLoadingMatches(false);
    }
  };

  const fetchPredictions = async () => {
    if (!session?.user) return;
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('match_id, predicted_outcome, predicted_diff')
        .eq('user_id', session.user.id);

      if (error) throw error;

      if (data) {
        const preds: Record<string, { outcome: 'home' | 'draw' | 'away'; diff: number }> = {};
        data.forEach((p) => {
          preds[p.match_id] = { outcome: p.predicted_outcome as any, diff: p.predicted_diff };
        });
        setUserPredictions(preds);
      }
    } catch (err: any) {
      console.error('Error fetching predictions:', err);
    }
  };

  const handlePredict = async (matchId: string, outcome: 'home' | 'draw' | 'away', diff: number): Promise<void> => {
    if (!session?.user || !userProfile) throw new Error('Giriş yapılmadı.');

    // ── Güvenlik: Maç başladıysa tahmin kabul etme (client-side ek guard)
    const match = matches.find(m => m.id === matchId);
    if (!match) throw new Error('Maç bulunamadı.');
    if (new Date(match.commence_time).getTime() <= Date.now()) {
      throw new Error('Tahmin süresi doldu: maç zaten başlamış.');
    }
    if (match.status !== 'pending') {
      throw new Error('Bu maç için tahmin yapılamaz.');
    }

    // ── Güvenlik: gol farkı 0-20 arası tam sayı olmalı
    const sanitizedDiff = Math.max(0, Math.min(20, Math.floor(Math.abs(diff))));

    let signedDiff = sanitizedDiff;
    if (outcome === 'away') {
      signedDiff = -sanitizedDiff;
    } else if (outcome === 'draw') {
      signedDiff = 0;
    }

    setUserPredictions(prev => ({ ...prev, [matchId]: { outcome, diff: signedDiff } }));

    const { error, status } = await supabase.from('predictions').upsert(
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
      if (status === 404 || error.message?.includes('predictions') || error.message?.includes('does not exist')) {
        setDbError('Tahmin kaydedilemedi. Supabase "predictions" tablosu bulunamadı. Lütfen SQL şemasını çalıştırın.');
      }
      throw new Error(error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('is_active_session');
    setSession(null);
    setUserProfile(null);
  };

  const filteredMatches = matches.filter((match) => {
    const matchTime = new Date(match.commence_time).getTime();
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (matchTab === 'completed') {
      return match.status === 'completed';
    } else {
      if (match.status === 'completed') {
        return matchTime >= now - oneDay && matchTime <= now;
      } else {
        return matchTime >= now - (3 * 60 * 60 * 1000) && matchTime <= now + oneDay;
      }
    }
  });

  return (
    <div className="min-h-screen flex flex-col selection:bg-violet-600/30 selection:text-white pb-12">
      {/* Premium Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-glow border border-white/10">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-extrabold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400 font-mono">
              HTALKS HASTALARI
            </h1>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">Dünya Kupası Tahmin Ligi</p>
          </div>
        </div>

        {session?.user ? (
          <div className="flex items-center gap-4">
            {/* Kullanıcı bilgisi — userProfile yüklenmemiş olsa bile oturumu göster */}
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-1.5 justify-end">
                <User className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-sm font-bold text-zinc-200">
                  {userProfile?.username ||
                    session.user.user_metadata?.username ||
                    'Kullanıcı'}
                </span>
              </div>
              <p className="text-xs text-emerald-400 font-extrabold font-mono mt-0.5 tracking-wide">
                {userProfile ? `${userProfile.total_points} Puan` : '...'}
              </p>
            </div>
            <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
            <button
              onClick={handleSignOut}
              className="bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all text-xs font-bold px-4 py-2.5 rounded-xl font-mono tracking-wider flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ÇIKIŞ</span>
            </button>
          </div>
        ) : (
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono hidden xs:block">
            Giriş Yapılmadı
          </div>
        )}
      </header>

      {/* Database Warning Banner */}
      {dbError && (
        <div className="max-w-7xl w-full mx-auto px-6 mt-6">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center gap-4 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-bold text-amber-300 font-mono">SUPABASE KURULUMU EKSİK VEYA HATALI</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {dbError}
              </p>
            </div>
            <button
              onClick={fetchLeaderboard}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all shrink-0 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Yeniden Dene
            </button>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        {/* Left Column: Fixtures / Matches (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {!session ? (
            <div className="py-12 flex justify-center items-center">
              <Auth onAuthSuccess={() => {
                fetchUserProfile();
                fetchLeaderboard();
                fetchPredictions();
              }} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tab Switcher */}
              <div className="flex justify-between items-center bg-zinc-900/30 p-2 rounded-2xl border border-white/5 gap-4 flex-wrap">
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 w-fit">
                  <button
                    onClick={() => setMatchTab('active')}
                    className={`px-4 py-2 text-xs font-mono font-bold rounded-lg transition-all ${
                      matchTab === 'active'
                        ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-glow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    GÜNÜN MAÇLARI
                  </button>
                  <button
                    onClick={() => setMatchTab('completed')}
                    className={`px-4 py-2 text-xs font-mono font-bold rounded-lg transition-all ${
                      matchTab === 'completed'
                        ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-glow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    TAMAMLANANLAR
                  </button>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest bg-white/5 py-1 px-3 rounded-lg border border-white/5">
                  {matchTab === 'active' ? 'Yalnızca sonraki 24s başlayacaklar' : 'Tamamlanmış tüm maçlar'}
                </div>
              </div>

              {loadingMatches ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
                  <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Maçlar Yükleniyor...</span>
                </div>
              ) : (
                <MatchList
                  matches={filteredMatches}
                  userPredictions={userPredictions}
                  onPredict={handlePredict}
                />
              )}
            </div>
          )}
        </div>

        {/* Right Column: Leaderboard (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Leaderboard users={users} currentUserId={session?.user?.id} />
          
          {/* Rules/Info Panel */}
          <div className="glass-panel rounded-2xl p-6 shadow-2xl border border-white/5 space-y-4">
            <h4 className="font-bold text-gray-200 font-mono tracking-wide uppercase text-sm flex items-center gap-2 border-b border-white/5 pb-2.5">
              <Info className="w-4 h-4 text-violet-400" /> Kurallar & Puanlama
            </h4>
            <ul className="space-y-3 text-zinc-400 text-xs leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0"></span>
                <span>Doğru kazanan (1X2) tahmini: <strong>Bahis Oranı</strong> kadar puan kazandırır (En yakın tam sayıya yuvarlanır).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0"></span>
                <span>Maçın gol farkını en yakın tahmin eden kullanıcı(lar) <strong>+1 Bonus Puan</strong> kazanır.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0"></span>
                <span>Tahminler maç başlangıç saatine kadar değiştirilebilir.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0"></span>
                <span>Yalnızca <strong>sonraki 24 saat içinde</strong> başlayacak maçlar listelenir ve tahmin edilebilir.</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-8 py-8 px-6 md:px-12 bg-black/20">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Legal Disclaimer */}
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 text-xs text-zinc-500 leading-relaxed">
            <p className="font-bold text-amber-400/70 font-mono uppercase tracking-wider mb-1">Yasal Uyarı</p>
            <p>
              Bu platform yalnızca eğlence ve sosyal rekabet amaçlı bir <strong className="text-zinc-400">ücretsiz tahmin oyunudur</strong>.
              Gerçek para, bahis veya kumar içermez. Platformda kazanılan puanların herhangi bir maddi karşılığı yoktur.
              Kullanıcılar platformu kendi iradeleriyle ve tamamen ücretsiz olarak kullanmaktadır.
              Bu platform, herhangi bir resmi spor örgütü, kulüp veya bahis şirketiyle bağlantılı değildir.
            </p>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
            <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest text-center sm:text-left">
              © {new Date().getFullYear()} HTalks Hastaları Dünya Kupası Tahmin Ligi — Tüm hakları saklıdır.
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 font-mono">
              <span className="uppercase tracking-widest">Yapımcı:</span>
              <a
                href="https://semihaydin.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-500/70 hover:text-violet-400 transition-colors font-bold"
              >
                Semih Aydın
              </a>
            </div>
          </div>

          {/* Privacy / Terms note */}
          <p className="text-[10px] text-zinc-700 text-center leading-relaxed">
            Bu siteyi kullanarak <span className="text-zinc-600">gizlilik politikamızı</span> ve{' '}
            <span className="text-zinc-600">kullanım koşullarımızı</span> kabul etmiş sayılırsınız.
            Kişisel verileriniz yalnızca oyun işlevselliği için kullanılır ve üçüncü taraflarla paylaşılmaz.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
