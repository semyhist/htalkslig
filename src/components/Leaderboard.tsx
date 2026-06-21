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
