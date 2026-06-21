import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Lock, User, AlertCircle, LogIn, UserPlus } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill username if remembered in browser
  useEffect(() => {
    const remembered = localStorage.getItem('remembered_username');
    const rememberFlag = localStorage.getItem('remember_me');
    if (rememberFlag === 'true' && remembered) {
      setUsername(remembered);
      setRememberMe(true);
    } else if (rememberFlag === 'false') {
      setRememberMe(false);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setError('Kullanıcı adı sadece harf, rakam, alt çizgi (_) ve tire (-) içerebilir, ve 3-20 karakter uzunluğunda olmalıdır.');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter uzunluğunda olmalıdır.');
      return;
    }

    setLoading(true);

    // Format username to dummy email for Supabase Auth
    const dummyEmail = `${username.toLowerCase().trim()}@htalks.com`;

    try {
      if (isSignUp) {
        // 1. Check if profiles table exists and username is taken
        const { data: existingUser, error: checkError, status } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username.trim())
          .maybeSingle();

        if (checkError) {
          console.error('Database check error:', checkError);
          if (status === 404 || checkError.message?.includes('profiles') || checkError.message?.includes('does not exist')) {
            throw new Error('Supabase "profiles" tablosu bulunamadı. Lütfen "20260621000000_init.sql" şemasını Supabase SQL Editor\'de çalıştırın.');
          }
        }

        if (existingUser) {
          throw new Error('Bu kullanıcı adı zaten alınmış. Lütfen başka bir kullanıcı adı seçin.');
        }

        // 2. Sign up user
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: dummyEmail,
          password,
          options: {
            data: {
              username: username.trim(),
            }
          }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // 3. Create profile fallback: check if trigger already created it
          const { data: profileCheck } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .maybeSingle();
            
          if (!profileCheck) {
            const { error: profileError } = await supabase
              .from('profiles')
              .insert([{ id: data.user.id, username: username.trim(), total_points: 0 }]);
            
            if (profileError) {
              console.error('Profile creation error:', profileError);
              throw new Error('Hesap oluşturuldu fakat profil kaydedilemedi. Supabase şemasını kontrol edin.');
            }
          }
        }
      } else {
        // Sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: dummyEmail,
          password,
        });

        if (signInError) {
          if (signInError.message === 'Invalid login credentials') {
            throw new Error('Kullanıcı adı veya şifre hatalı.');
          }
          throw signInError;
        }
      }

      // Handle "Remember Me" preference on successful login/signup
      if (rememberMe) {
        localStorage.setItem('remember_me', 'true');
        localStorage.setItem('remembered_username', username);
      } else {
        localStorage.setItem('remember_me', 'false');
        localStorage.removeItem('remembered_username');
      }

      // Mark this session as active in sessionStorage so tab closing triggers logout if Remember Me is off
      sessionStorage.setItem('is_active_session', 'true');

      onAuthSuccess();
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-8 rounded-2xl shadow-glow max-w-md w-full mx-auto border border-white/10 relative overflow-hidden">
      {/* Decorative blurred backgrounds */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-violet-600/10 blur-3xl rounded-full"></div>
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-600/10 blur-3xl rounded-full"></div>

      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-glow mb-3 overflow-hidden">
          <img src="/logo.jpg" alt="HTalks Logo" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-2xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400 font-mono tracking-wider">
          HTALKS HASTALARI
        </h2>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Dünya Kupası Tahmin Ligi</p>
      </div>

      <form 
        onSubmit={handleAuth} 
        className="space-y-4"
        id={isSignUp ? "signup-form" : "login-form"}
        key={isSignUp ? "signup" : "login"}
      >
        <div>
          <label 
            htmlFor="username-input" 
            className="block text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-zinc-500" /> Kullanıcı Adı
          </label>
          <input
            id="username-input"
            name="username"
            type="text"
            required
            autoComplete="username"
            placeholder="Kullanıcı adınızı girin"
            className="w-full bg-black/40 border border-white/10 hover:border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-mono placeholder:text-zinc-600 text-sm"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label 
            htmlFor="password-input" 
            className="block text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-zinc-500" /> Şifre
          </label>
          <input
            id="password-input"
            name="password"
            type="password"
            required
            autoComplete={isSignUp ? "new-password" : "current-password"}
            placeholder="••••••"
            className="w-full bg-black/40 border border-white/10 hover:border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-mono placeholder:text-zinc-600 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Remember Me Option */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-white/10 bg-black/40 text-violet-600 focus:ring-violet-500/50 focus:ring-offset-black"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="text-xs text-zinc-400 hover:text-zinc-300 transition-colors">Beni Hatırla</span>
          </label>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-red-400 text-xs bg-red-950/20 border border-red-500/20 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full neon-btn-primary py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-2"
        >
          {loading ? (
            <span>İşleniyor...</span>
          ) : isSignUp ? (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Kayıt Ol</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Giriş Yap</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center border-t border-white/5 pt-4">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
          }}
          className="text-xs text-zinc-400 hover:text-violet-400 transition-colors font-medium"
        >
          {isSignUp ? 'Zaten hesabınız var mı? Giriş Yapın' : 'Hesabınız yok mu? Kayıt Olun'}
        </button>
      </div>
    </div>
  );
};
