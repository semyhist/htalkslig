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
    <div className="bg-brand-card p-6 rounded-xl border border-gray-800 shadow-xl max-w-md w-full mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-brand-accent">
        🏆 HTalks Dünya Kupası
      </h2>
      <form onSubmit={handleAuth} className="space-y-4">
        {isSignUp && (
          <div>
            <label className="block text-sm font-medium mb-1">Kullanıcı Adı</label>
            <input
              type="text"
              required
              className="w-full bg-brand-dark border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-accent"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">E-posta</label>
          <input
            type="email"
            required
            className="w-full bg-brand-dark border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-accent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Şifre</label>
          <input
            type="password"
            required
            className="w-full bg-brand-dark border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-accent"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-accent hover:bg-blue-600 transition-colors py-2.5 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? 'Yükleniyor...' : isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}
        </button>
      </form>
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-gray-400 hover:text-brand-accent transition-colors"
        >
          {isSignUp ? 'Zaten hesabınız var mı? Giriş Yapın' : 'Hesabınız yok mu? Kayıt Olun'}
        </button>
      </div>
    </div>
  );
};
