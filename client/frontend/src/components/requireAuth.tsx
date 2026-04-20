// components/requireAuth.tsx
import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

export function withAuth(Component: React.ComponentType) {
  return function AuthenticatedComponent(props: any) {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    
    useEffect(() => {
      if (!token) {
        navigate({ to: '/login' });
      }
    }, [token, navigate]);
    
    if (!token) {
      return null;
    }
    
    return <Component {...props} />;
  };
}