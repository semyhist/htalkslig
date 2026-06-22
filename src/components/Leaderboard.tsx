import React, { useState } from 'react';
import { Crown, Medal, Award, Users, Maximize2, X, Trophy } from 'lucide-react';

export interface LeaderboardUser {
  id: string;
  username: string;
  total_points: number;
}

interface LeaderboardProps {
  users: LeaderboardUser[];
  currentUserId?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = React.memo(({ users, currentUserId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to get initials
  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  // Limit sidebar display to top 5
  const sidebarUsers = users.slice(0, 5);

  // Filter users in modal based on search query
  const modalUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserRow = (user: LeaderboardUser, originalIndex: number) => {
    const isCurrentUser = user.id === currentUserId;
    const rank = originalIndex + 1;
    
    let rankBadge = null;
    let itemStyle = "bg-zinc-900/30 border-white/5 hover:border-white/10 hover:bg-zinc-900/50";
    let avatarGradient = "from-zinc-700 to-zinc-800 text-zinc-300";

    if (rank === 1) {
      rankBadge = (
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)] shrink-0">
          <Crown className="w-3.5 h-3.5" />
        </div>
      );
      itemStyle = "bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-amber-500/20 hover:border-amber-500/35 shadow-[0_4px_20px_rgba(245,158,11,0.05)]";
      avatarGradient = "from-amber-400 to-amber-600 text-black font-extrabold";
    } else if (rank === 2) {
      rankBadge = (
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-zinc-300/10 border border-zinc-300/30 text-zinc-300 shadow-[0_0_12px_rgba(224,224,224,0.15)] shrink-0">
          <Medal className="w-3.5 h-3.5" />
        </div>
      );
      itemStyle = "bg-gradient-to-r from-zinc-300/10 to-zinc-400/5 border-zinc-300/20 hover:border-zinc-300/35";
      avatarGradient = "from-zinc-300 to-zinc-500 text-black font-extrabold";
    } else if (rank === 3) {
      rankBadge = (
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-700/10 border border-amber-700/30 text-amber-500 shadow-[0_0_12px_rgba(180,83,9,0.15)] shrink-0">
          <Award className="w-3.5 h-3.5" />
        </div>
      );
      itemStyle = "bg-gradient-to-r from-amber-700/10 to-amber-800/5 border-amber-700/20 hover:border-amber-700/35";
      avatarGradient = "from-amber-600 to-amber-800 text-white font-semibold";
    } else {
      rankBadge = (
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-zinc-800/40 border border-white/5 text-zinc-500 font-bold font-mono text-xs shrink-0">
          {rank}
        </div>
      );
    }

    if (isCurrentUser) {
      itemStyle = "bg-gradient-to-r from-violet-600/15 to-indigo-600/10 border-violet-500/40 shadow-glow hover:border-violet-500/60";
    }

    return (
      <div
        key={user.id}
        className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${itemStyle}`}
      >
        <div className="flex items-center gap-3">
          {rankBadge}
          <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-[10px] tracking-wider font-bold shadow-inner`}>
            {getInitials(user.username)}
          </div>
          <span className="text-sm font-semibold tracking-wide text-zinc-200">
            {user.username}
            {isCurrentUser && (
              <span className="text-[9px] text-violet-400 font-mono font-bold ml-1.5 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded">
                SEN
              </span>
            )}
          </span>
        </div>
        <span className="text-xs font-bold text-zinc-300 font-mono bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
          {user.total_points} Puan
        </span>
      </div>
    );
  };

  return (
    <>
      <div className="glass-panel rounded-2xl p-6 shadow-2xl relative overflow-hidden border border-white/5">
        {/* Background glow decorator */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-violet-500/10 blur-3xl rounded-full"></div>
        
        {/* Header with expand functionality */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="flex justify-between items-center border-b border-white/5 pb-3 mb-5 cursor-pointer group"
        >
          <h3 className="text-sm font-bold tracking-wider font-mono text-zinc-300 flex items-center gap-2 uppercase">
            <Users className="w-4 h-4 text-violet-400" />
            <span>LİDERLİK TABLOSU</span>
          </h3>
          <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-zinc-400 hover:text-white group-hover:scale-105">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5 pr-1">
          {users.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono uppercase tracking-widest">
              Henüz katılım yok
            </div>
          ) : (
            sidebarUsers.map((user, idx) => renderUserRow(user, idx))
          )}
        </div>

        {users.length > 5 && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full mt-4 bg-white/5 hover:bg-violet-600/20 text-zinc-300 hover:text-white border border-white/5 hover:border-violet-500/30 transition-all text-xs font-bold py-2.5 rounded-xl font-mono tracking-wider flex items-center justify-center gap-2"
          >
            TÜMÜNÜ GÖSTER ({users.length})
          </button>
        )}
      </div>

      {/* Full screen Leaderboard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="glass-panel w-full max-w-xl max-h-[80vh] rounded-3xl p-6 md:p-8 flex flex-col border border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.15)] relative overflow-hidden">
            {/* Background decorators */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-600/10 blur-3xl rounded-full"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-600/10 blur-3xl rounded-full"></div>

            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-glow border border-white/10">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-wide text-zinc-100 font-mono uppercase">LİDERLİK TABLOSU (TÜMÜ)</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mt-0.5">WCTURKİYE TÜM KATILIMCILAR</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSearchQuery('');
                }}
                className="p-2 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl transition-all text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search query box */}
            <div className="mb-4 relative z-10">
              <input
                type="text"
                placeholder="Kullanıcı adı ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/5 hover:border-white/10 focus:border-violet-500 focus:outline-none rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 font-mono transition-all"
              />
            </div>

            {/* Users list container */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 relative z-10 scrollbar-thin">
              {modalUsers.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500 font-mono uppercase tracking-widest">
                  Kullanıcı bulunamadı
                </div>
              ) : (
                modalUsers.map((user) => {
                  const originalIndex = users.findIndex(u => u.id === user.id);
                  return renderUserRow(user, originalIndex);
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
});
