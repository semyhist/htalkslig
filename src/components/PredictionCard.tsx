import React, { useState } from 'react';

export interface MatchData {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  home_odd: number;
  draw_odd: number;
  away_odd: number;
}

interface PredictionCardProps {
  match: MatchData;
  initialPrediction?: { outcome: 'home' | 'draw' | 'away'; diff: number };
  onPredict: (matchId: string, outcome: 'home' | 'draw' | 'away', diff: number) => void;
}

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

  return (
    <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-none shadow-none space-y-6 max-w-md w-full mx-auto text-zinc-100 font-mono">
      {/* Header Info */}
      <div className="flex justify-between items-center text-xs tracking-widest text-zinc-500 uppercase">
        <span>⚽ fıfa world cup</span>
        <span>{formattedDate}</span>
      </div>

      {/* Teams Display */}
      <div className="flex justify-between items-center text-sm font-medium border-y border-zinc-900 py-3 uppercase tracking-wider">
        <span className="flex-1 text-left">{match.home_team}</span>
        <span className="text-zinc-600 text-xs px-2">vs</span>
        <span className="flex-1 text-right">{match.away_team}</span>
      </div>

      {/* 1X2 Outcome Selector */}
      <div className="grid grid-cols-3 gap-1 border-b border-zinc-900 pb-6">
        <button
          onClick={() => handleSelectOutcome('home')}
          className={`py-3 text-xs uppercase border transition-colors ${
            outcome === 'home'
              ? 'bg-zinc-100 border-zinc-100 text-zinc-950 font-bold'
              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-500'
          }`}
        >
          {match.home_team}
          <div className="text-[10px] opacity-80 mt-1 font-sans">
            {match.home_odd} (x10p)
          </div>
        </button>

        <button
          onClick={() => handleSelectOutcome('draw')}
          className={`py-3 text-xs uppercase border transition-colors ${
            outcome === 'draw'
              ? 'bg-zinc-100 border-zinc-100 text-zinc-950 font-bold'
              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-500'
          }`}
        >
          beraberlik
          <div className="text-[10px] opacity-80 mt-1 font-sans">
            {match.draw_odd} (x10p)
          </div>
        </button>

        <button
          onClick={() => handleSelectOutcome('away')}
          className={`py-3 text-xs uppercase border transition-colors ${
            outcome === 'away'
              ? 'bg-zinc-100 border-zinc-100 text-zinc-950 font-bold'
              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-500'
          }`}
        >
          {match.away_team}
          <div className="text-[10px] opacity-80 mt-1 font-sans">
            {match.away_odd} (x10p)
          </div>
        </button>
      </div>

      {/* Goal Difference Input */}
      <div className="space-y-2">
        <label className="block text-xs uppercase tracking-widest text-zinc-500">
          gol farkı tahmini
        </label>
        <input
          type="number"
          min="0"
          disabled={outcome === 'draw'}
          placeholder={outcome === 'draw' ? 'beraberlik için 0' : 'kaç gol farkla kazanır?'}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-none p-3 text-sm text-zinc-100 font-mono focus:outline-none focus:border-zinc-100 disabled:opacity-50"
          value={diff}
          onChange={(e) => handleDiffChange(e.target.value)}
        />
      </div>
    </div>
  );
};
