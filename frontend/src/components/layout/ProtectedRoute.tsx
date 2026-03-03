import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../api/auth.api';

export default function ProtectedRoute() {
  const { accessToken, setUser, logout } = useAuthStore();
  const [checking, setChecking] = useState(!accessToken);

  useEffect(() => {
    if (!accessToken) {
      authApi
        .me()
        .then((res) => {
          setUser(res.data);
          setChecking(false);
        })
        .catch(() => {
          logout();
          setChecking(false);
        });
    }
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const { user } = useAuthStore.getState();
  if (!accessToken && !user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
