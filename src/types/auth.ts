
import { User, Session } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

export type UserProfile = Database['public']['Tables']['profiles']['Row'];

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}
