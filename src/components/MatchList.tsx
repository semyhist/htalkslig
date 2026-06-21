import React, { useState } from 'react';
import type { Match } from '../utils/api';

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
