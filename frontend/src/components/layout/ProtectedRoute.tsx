import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import axios from 'axios';

export default function ProtectedRoute() {
  const { accessToken, setToken, setUser, logout } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (accessToken) {
      setChecking(false);
      return;
    }

    // Sem access token: tenta renovar via refresh cookie
    axios
      .post<{ accessToken: string }>(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .then(({ data }) => {
        setToken(data.accessToken);
        // Busca dados do usuário com o novo token
        return axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/auth/me`, {
          headers: { Authorization: `Bearer ${data.accessToken}` },
          withCredentials: true,
        });
      })
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setChecking(false);
      });
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!accessToken) return <Navigate to="/login" replace />;
  return <Outlet />;
}
