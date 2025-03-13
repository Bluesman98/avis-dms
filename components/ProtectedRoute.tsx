'use client';
import { useAuth } from '../lib/AuthContext';
import NotAuthorized from '@/pages/400';

const ProtectedRoute = ({ children, reqRole }: { children: React.ReactNode; reqRole: string }) => {
  const { user, role, loading } = useAuth();

  if (loading || !user || role !== reqRole) {
    return   <NotAuthorized/>
  }

  return <>{children}</>;
};

export default ProtectedRoute;