import { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { loginUser, registerUser, logoutUser } from '@/lib/api';
import { AuthContextType, User, StudentProfile, EmployerProfile } from '@/types';

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Fetch current user data
  const { data, isLoading, refetch } = useQuery<{
    user: User;
    profile: StudentProfile | EmployerProfile;
  }>({
    queryKey: ['/api/auth/me'],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => 
      loginUser(email, password),
    onSuccess: () => {
      refetch();
      setLocation('/dashboard');
    },
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (userData: any) => registerUser(userData),
    onSuccess: (_, variables) => {
      if (variables.role === 'student') {
        // If student, auto-login and redirect
        refetch();
        setLocation('/dashboard');
      } else {
        // If employer, redirect to login with message
        setLocation('/login?registered=true');
      }
    },
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.clear();
      setLocation('/login');
    },
  });
  
  // Login function
  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };
  
  // Register function
  const register = async (userData: any) => {
    await registerMutation.mutateAsync(userData);
  };
  
  // Logout function
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };
  
  const authContextValue: AuthContextType = {
    user: data?.user || null,
    profile: data?.profile || null,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    isAuthenticated: !!data?.user,
    login,
    register,
    logout,
  };
  
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
