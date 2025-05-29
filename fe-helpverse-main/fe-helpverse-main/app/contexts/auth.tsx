import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/auth';
import type { User } from '../services/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string, rememberMe: boolean) => Promise<void>;
  registerUser: (data: {
    username: string;
    fullName: string;
    email: string;
    phone: string;
    password: string;
    agreeTerms: boolean;
  }) => Promise<void>;
  registerEventOrganizer: (data: {
    username: string;
    fullName: string;
    email: string;
    phone: string;
    organizerName: string;
    password: string;
    agreeTerms: boolean;
  }) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUserData: () => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function for refreshing user data from server
  const refreshUserData = async (): Promise<User> => {
    try {
      setLoading(true);
      const userData = await authService.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Error refreshing user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh user data');
      // Bersihkan user jika gagal memperbarui data
      setUser(null);
      authService.clearStoredAuthData();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          try {
            const userData = await authService.getCurrentUser();
            setUser(userData);
          } catch (fetchErr) {
            console.error('Error fetching user data:', fetchErr);
            
            // Jika gagal memvalidasi token, anggap user tidak terautentikasi
            // dan hapus token serta data user yang tersimpan
            setUser(null);
            authService.clearStoredAuthData();
            setError('Session expired. Please login again.');
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        // Bersihkan user jika terjadi error
        setUser(null);
        authService.clearStoredAuthData();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authService.login({ username, password, rememberMe });
      setUser(userData);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Function for registering regular users
  const registerUser = async (data: {
    username: string;
    fullName: string;
    email: string;
    phone: string;
    password: string;
    agreeTerms: boolean;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authService.registerUser({
        ...data,
        role: 'user'
      });
      setUser(userData);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerEventOrganizer = async (data: {
    username: string;
    fullName: string;
    email: string;
    phone: string;
    organizerName: string;
    password: string;
    agreeTerms: boolean;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authService.registerEventOrganizer({
        ...data,
        role: 'eventOrganizer'
      });
      return userData;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout().catch((err) => {
      console.error('Logout failed:', err);
    });
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    registerUser,
    registerEventOrganizer,
    logout,
    isAuthenticated: !!user,
    refreshUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 