import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { apiLogin, getSessionUser, signOut } from '../services/firebaseService';
import { supabase } from '../firebaseConfig'; // Now the supabase client

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      const currentUser = await getSessionUser();
      setUser(currentUser);
      setLoading(false);
    };

    checkUserSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        const currentUser = session ? await getSessionUser() : null;
        setUser(currentUser);
        // Set loading to false only on the initial check
        if(loading){
            setLoading(false);
        }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loading]);

  const login = async (email: string, pass:string) => {
    setLoading(true);
    try {
      const loggedInUser = await apiLogin(email, pass);
      if (loggedInUser) {
        setUser(loggedInUser);
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
        console.error("Login failed:", error);
        throw error;
    } finally {
        setLoading(false);
    }
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
