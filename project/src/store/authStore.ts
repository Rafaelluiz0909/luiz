import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name?: string;
  plan_type?: string;
  plan_expires_at?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUserPlan: (planType: string, expiresAt: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      initialized: false,

      signIn: async (email: string, password: string) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          if (data.user) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            set({
              user: {
                id: data.user.id,
                email: data.user.email!,
                name: profileData?.name,
                plan_type: profileData?.plan_type,
                plan_expires_at: profileData?.plan_expires_at,
              },
            });
          }
        } catch (error) {
          throw error;
        }
      },

      signUp: async (email: string, password: string, name: string) => {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: name,
              },
            },
          });

          if (error) throw error;

          if (data.user) {
            set({
              user: {
                id: data.user.id,
                email: data.user.email!,
                name: name,
              },
            });
          }
        } catch (error) {
          throw error;
        }
      },

      signOut: async () => {
        try {
          await supabase.auth.signOut();
          set({ user: null });
        } catch (error) {
          console.error('Error signing out:', error);
          throw error;
        }
      },

      checkAuth: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            set({
              user: {
                id: user.id,
                email: user.email!,
                name: profileData?.name,
                plan_type: profileData?.plan_type,
                plan_expires_at: profileData?.plan_expires_at,
              },
            });
          }
        } catch (error) {
          console.error('Error checking auth:', error);
        } finally {
          set({ loading: false, initialized: true });
        }
      },

      updateUserPlan: async (planType: string, expiresAt: string) => {
        set((state) => ({
          user: state.user ? {
            ...state.user,
            plan_type: planType,
            plan_expires_at: expiresAt,
          } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      skipHydration: false,
    }
  )
);