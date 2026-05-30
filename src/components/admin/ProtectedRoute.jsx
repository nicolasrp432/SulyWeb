import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, ShieldOff, LogOut } from 'lucide-react';
import Logo from '@/components/Logo';

const ProtectedRoute = ({ children }) => {
  const { user, loading, isAuthorized, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-admin-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-brand-rose animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-cream flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          <div className="bg-white border border-admin-border rounded-2xl p-8 shadow-rose-md text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center">
              <ShieldOff className="w-7 h-7 text-amber-700" />
            </div>
            <h1 className="text-lg font-bold text-admin-text">Acceso no autorizado</h1>
            <p className="text-sm text-admin-muted mt-2 leading-relaxed">
              Tu cuenta <strong className="text-admin-text">{user.email}</strong> está autenticada
              pero no tiene permisos para entrar al panel de administración.
            </p>
            <p className="text-xs text-admin-muted mt-3">
              Contacta con el responsable del salón para que active tu acceso desde la sección
              "Equipo administrador".
            </p>
            <button
              onClick={() => signOut()}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 h-11 bg-gradient-rose-gold text-white text-sm font-bold rounded-xl shadow-rose-sm hover:shadow-rose-md transition-all"
            >
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
