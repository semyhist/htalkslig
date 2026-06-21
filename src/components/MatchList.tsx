import React from 'react';
import type { Match } from '../utils/api';
import { PredictionCard } from './PredictionCard';
import { Calendar } from 'lucide-react';

interface MatchListProps {
  matches: Match[];
  userPredictions: Record<string, { outcome: 'home' | 'draw' | 'away'; diff: number }>;
  onPredict: (matchId: string, outcome: 'home' | 'draw' | 'away', diff: number) => Promise<void>;
}

export const MatchList: React.FC<MatchListProps> = ({
  matches,
  userPredictions,
  onPredict,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-white/5 pb-3">
        <Calendar className="w-5 h-5 text-violet-400" />
        <h3 className="text-sm font-bold tracking-wider font-mono uppercase text-zinc-300">
          GÜNCEL TAHMİN ARENASI
        </h3>
      </div>
      
      {matches.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-zinc-500 font-mono uppercase tracking-widest text-xs border border-white/5">
          Yaklaşan maç bulunmamaktadır.
        </div>
      ) : (
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
      )}
    </div>
  );
};
