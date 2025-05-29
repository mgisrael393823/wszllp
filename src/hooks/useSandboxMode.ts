import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSandboxUser } from '../utils/sandbox';

/**
 * Hook to check if current user is in sandbox mode
 * Returns sandbox status and user email
 */
export const useSandboxMode = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSandbox, setIsSandbox] = useState(false);

  useEffect(() => {
    console.log('useSandboxMode - user:', user);
    console.log('useSandboxMode - userEmail:', user?.email);
    console.log('useSandboxMode - SANDBOX_EMAIL check:', user?.email === 'evictionsandbox@gmail.com');
    
    if (user) {
      const isUserSandbox = isSandboxUser(user.email);
      console.log('useSandboxMode - isSandboxUser result:', isUserSandbox);
      setIsSandbox(isUserSandbox);
      setIsLoading(false);
    } else {
      setIsSandbox(false);
      setIsLoading(false);
    }
  }, [user]);

  return {
    isSandbox,
    isLoading,
    userEmail: user?.email || null,
    sandboxIndicator: isSandbox ? '🧪 DEMO MODE' : null,
  };
};