import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';

export function useUserRole(requiredRoles?: UserRole[]) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Wait until auth state is determined
    if (isLoading) return;
    
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      setLocation('/login');
      return;
    }
    
    // If specific roles are required, check if user has one of them
    if (requiredRoles && requiredRoles.length > 0) {
      if (!user || !requiredRoles.includes(user.role)) {
        // Redirect to dashboard if user doesn't have required role
        setLocation('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRoles, setLocation]);
  
  return {
    user,
    isLoading,
    isAuthenticated,
    hasRequiredRole: isAuthenticated && 
      user && 
      (!requiredRoles || requiredRoles.includes(user.role)),
  };
}
