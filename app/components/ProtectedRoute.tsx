'use client';
import { useAuth } from '../../lib/AuthContext';
import { useTwoFA } from '../../lib/TwoFAContext';
import NotAuthorized from '@/pages/400';

const ProtectedRoute = ({ children, reqRole }: { children: React.ReactNode; reqRole: string[] }) => {
  const { user, roles, loading } = useAuth();
  const { isVerified } = useTwoFA();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !roles || !roles.some(role => reqRole.includes(role)) || !isVerified) {
    return <NotAuthorized />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;