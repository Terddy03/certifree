import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { UserProgress, UserAchievement } from '@/lib/mock-data/users';
import { componentDebug, startTimer, endTimer } from '@/lib/debugger';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  bio?: string;
  subscriptionTier: "free" | "premium";
  learningStreak: number;
  totalCertificationsCompleted: number;
  joinedAt: string;
  isAdmin?: boolean;
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    newsletter: boolean;
    learningReminders: boolean;
  };
  stats: {
    hoursLearned: number;
    averageScore: number;
    skillsLearned: string[];
    currentGoal: string;
  };
  userProgress: UserProgress[];
  userAchievements: UserAchievement[];
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const debug = componentDebug('useAuth');
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const getActiveSession = async () => {
      startTimer('useAuth:getActiveSession');
      debug.log('Starting session fetch');
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          debug.log('Session found', { userId: session.user.id });
          setAuthState(prev => ({ ...prev, user: session.user }));
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) throw profileError;

          debug.log('Profile fetched', { profile });
          
          const { data: userProgress, error: userProgressError } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', session.user.id);
          
          if (userProgressError) throw userProgressError;

          debug.log('User progress fetched', { progressCount: userProgress?.length });
          
          const { data: userAchievements, error: userAchievementsError } = await supabase
            .from('user_achievements')
            .select('*')
            .eq('user_id', session.user.id);

          if (userAchievementsError) throw userAchievementsError;

          debug.log('User achievements fetched', { achievementsCount: userAchievements?.length });

          // Transform and provide defaults for missing fields
          const transformedProfile: UserProfile = {
            id: profile?.id || session.user.id,
            email: profile?.email || session.user.email || '',
            fullName: profile?.full_name || profile?.fullName || 'User',
            avatarUrl: profile?.avatar_url || profile?.avatarUrl || '',
            bio: profile?.bio || '',
            subscriptionTier: profile?.subscription_tier || profile?.subscriptionTier || 'free',
            learningStreak: profile?.learning_streak || profile?.learningStreak || 0,
            totalCertificationsCompleted: profile?.total_certifications_completed || profile?.totalCertificationsCompleted || 0,
            joinedAt: profile?.joined_at || profile?.joinedAt || new Date().toISOString(),
            isAdmin: profile?.is_admin || false,
            preferences: {
              emailNotifications: profile?.preferences?.emailNotifications || true,
              pushNotifications: profile?.preferences?.pushNotifications || true,
              newsletter: profile?.preferences?.newsletter || false,
              learningReminders: profile?.preferences?.learningReminders || true,
            },
            stats: {
              hoursLearned: profile?.stats?.hoursLearned || profile?.stats?.hours_learned || 0,
              averageScore: profile?.stats?.averageScore || profile?.stats?.average_score || 0,
              skillsLearned: profile?.stats?.skillsLearned || profile?.stats?.skills_learned || [],
              currentGoal: profile?.stats?.currentGoal || profile?.stats?.current_goal || 'Complete your first certification',
            },
            userProgress: userProgress as UserProgress[] || [],
            userAchievements: userAchievements as UserAchievement[] || [],
          };

          debug.log('Profile transformation complete', { transformedProfile });
          
          setAuthState(prev => ({
            ...prev,
            profile: transformedProfile,
            loading: false,
          }));
          
          endTimer('useAuth:getActiveSession');
        } else {
          debug.log('No session found');
          setAuthState(prev => ({ ...prev, user: null, profile: null, loading: false }));
        }
      } catch (error: any) {
        debug.error("Error fetching session or profile", { error: error.message });
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
      }
    };

    getActiveSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(prev => ({ ...prev, user: session?.user || null, loading: false }));
      if (session?.user) {
        // Re-fetch profile if auth state changes to logged in
        getActiveSession();
      }
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  return authState;
}; 