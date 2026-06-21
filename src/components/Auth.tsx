import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AuthProps {
  onAuthSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: data.user.id, username, total_points: 0 }]);
          if (profileError) throw profileError;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
      onAuthSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-8 rounded-2xl shadow-glow max-w-md w-full mx-auto border border-white/10 relative overflow-hidden">
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-violet-600/10 blur-3xl rounded-full"></div>
      <h2 className="text-3xl font-extrabold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400 font-mono tracking-wide">
        🏆 HTALKS ARENA
      </h2>
      <form onSubmit={handleAuth} className="space-y-4">
        {isSignUp && (
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-1">Kullanıcı Adı</label>
            <input
              type="text"
              required
              className="w-full bg-black/40 border border-white/10 hover:border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-mono"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        )}
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-1">E-posta</label>
          <input
            type="email"
            required
            className="w-full bg-black/40 border border-white/10 hover:border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-mono"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-1">Şifre</label>
          <input
            type="password"
            required
            className="w-full bg-black/40 border border-white/10 hover:border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-mono"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all py-3.5 rounded-xl font-bold text-white shadow-glow disabled:opacity-50 hover:-translate-y-0.5"
        >
          {loading ? 'Yükleniyor...' : isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}
        </button>
      </form>
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-xs text-zinc-400 hover:text-violet-400 transition-colors"
        >
          {isSignUp ? 'Zaten hesabınız var mı? Giriş Yapın' : 'Hesabınız yok mu? Kayıt Olun'}
        </button>
      </div>
    </div>
  );
};
