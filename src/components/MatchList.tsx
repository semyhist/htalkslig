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
