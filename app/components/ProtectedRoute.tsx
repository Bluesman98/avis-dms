'use client';
import { useAuth } from '../../lib/AuthContext';
import NotAuthorized from '@/pages/400';

const ProtectedRoute = ({ children, reqRole }: { children: React.ReactNode; reqRole: string[] }) => {
  const { user, roles, loading } = useAuth();
  if (loading || !user || !roles || !roles.some(role => reqRole.includes(role))) {
    return   <NotAuthorized/>
  }

  return <>{children}</>;
};

export default ProtectedRoute;