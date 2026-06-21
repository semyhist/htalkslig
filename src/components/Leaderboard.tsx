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
