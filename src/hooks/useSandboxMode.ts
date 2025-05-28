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
    if (user) {
      setIsSandbox(isSandboxUser(user.email));
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