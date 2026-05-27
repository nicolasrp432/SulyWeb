import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Logo from '@/components/Logo';

const LoginPage = () => {
  const { user, signIn, loading } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!loading && user) return <Navigate to={from} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: signInError } = await signIn(email, password);
    if (signInError) setError('Credenciales incorrectas. Verifica tu email y contraseña.');
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-cream flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        <div className="bg-white border border-brand-rose-100 rounded-2xl p-8 shadow-rose-md">
          <h1 className="text-xl font-bold text-brand-dark mb-1">Panel de Administración</h1>
          <p className="text-sm text-brand-mid mb-6">Inicia sesión para continuar</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-mid uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-brand-rose-50 border border-brand-rose-100 rounded-xl text-brand-dark text-sm placeholder:text-brand-mid/50 focus:outline-none focus:border-brand-rose focus:ring-2 focus:ring-brand-rose/20 transition-colors"
                placeholder="admin@ejemplo.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-mid uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 pr-10 bg-brand-rose-50 border border-brand-rose-100 rounded-xl text-brand-dark text-sm placeholder:text-brand-mid/50 focus:outline-none focus:border-brand-rose focus:ring-2 focus:ring-brand-rose/20 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-mid hover:text-brand-rose transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-gradient-rose-gold hover:brightness-105 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2 shadow-rose-sm"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
