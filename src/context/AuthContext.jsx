import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Map Supabase user to our app's user shape
  const mapUser = (supabaseUser) => {
    if (!supabaseUser) return null;
    return {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
      email: supabaseUser.email || '',
      phone: supabaseUser.user_metadata?.phone || supabaseUser.phone || '',
      country: supabaseUser.user_metadata?.country || 'US',
      bio: supabaseUser.user_metadata?.bio || '',
      avatar: supabaseUser.user_metadata?.avatar || null,
      rating: supabaseUser.user_metadata?.rating || 0,
      gigsPosted: supabaseUser.user_metadata?.gigsPosted || 0,
      gigsCompleted: supabaseUser.user_metadata?.gigsCompleted || 0,
      totalEarned: supabaseUser.user_metadata?.totalEarned || 0,
      skills: supabaseUser.user_metadata?.skills || [],
      createdAt: supabaseUser.created_at,
    };
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(mapUser(currentSession?.user ?? null));
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(mapUser(newSession?.user ?? null));
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (identifier, password) => {
    const trimmed = identifier.trim();
    const isEmail = trimmed.includes('@');

    if (isEmail) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });
      if (error) throw error;
      return mapUser(data.user);
    } else {
      // Mobile Number login attempt
      let formattedPhone = trimmed;
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone.replace(/\D/g, '');
      }

      // Try phone sign-in via Supabase Auth
      let res = await supabase.auth.signInWithPassword({
        phone: formattedPhone,
        password,
      });

      if (res.error) {
        // Fallback: try raw digits
        const rawDigits = trimmed.replace(/\D/g, '');
        const altRes = await supabase.auth.signInWithPassword({
          phone: rawDigits,
          password,
        });
        if (!altRes.error) {
          return mapUser(altRes.data.user);
        }
        throw res.error;
      }
      return mapUser(res.data.user);
    }
  };

  const signup = async (name, email, phone, country, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      phone: phone || undefined,
      options: {
        data: {
          name,
          phone,
          country,
        },
      },
    });
    if (error) throw error;
    return mapUser(data.user);
  };

  const sendOtp = async (email, metadata = {}) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: metadata,
        shouldCreateUser: true,
      },
    });
    if (error) throw error;
    return data;
  };

  const verifyOtp = async (email, token) => {
    let { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      const fallback = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });
      if (fallback.error) throw fallback.error;
      data = fallback.data;
    }

    const mapped = mapUser(data.user);
    setUser(mapped);
    setSession(data.session);
    return mapped;
  };

  const updateProfile = async (updates) => {
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    });
    if (error) throw error;
    const updatedUser = mapUser(data.user);
    setUser(updatedUser);
    return updatedUser;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isAuthenticated: !!user,
      login,
      sendOtp,
      verifyOtp,
      signup,
      updateProfile,
      logout,
      supabase,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
