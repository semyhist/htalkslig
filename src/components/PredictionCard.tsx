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
    initialPrediction ? String(Math.abs(initialPrediction.diff)) : ''
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
          <span className="flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider font-mono animate-pulse">
            BAŞLAMADI
          </span>
        )}
      </div>

      <div className="flex justify-between items-center text-[10px] text-zinc-500 tracking-widest uppercase font-mono mb-2 pr-24">
        <span>⚽ fıfa world cup</span>
        <span>{formattedDate}</span>
      </div>

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
