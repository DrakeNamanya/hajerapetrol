
/**
 * Comprehensive auth state cleanup utility to prevent authentication limbo states
 */
export const cleanupAuthState = () => {
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if in use
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  }
  
  console.log('Auth state cleaned up');
};

/**
 * Recovery mechanism for corrupted auth states
 */
export const recoverAuthState = async () => {
  try {
    // Import here to avoid circular dependencies
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Attempt to refresh session
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.log('Session refresh failed, cleaning up auth state');
      cleanupAuthState();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Auth recovery failed:', error);
    cleanupAuthState();
    return null;
  }
};
