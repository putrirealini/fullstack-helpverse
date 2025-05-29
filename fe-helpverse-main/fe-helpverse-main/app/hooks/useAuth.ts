import { useState } from 'react';
import { authService } from '../services/auth';
import type { User } from '../services/auth';

// Custom hook untuk login
export const useLogin = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const login = async (username: string, password: string, rememberMe: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authService.login({ username, password, rememberMe });
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error, user };
};

// Custom hook untuk register user biasa
export const useRegisterUser = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<User | null>(null);

  const register = async (data: {
    username: string;
    fullName: string;
    email: string;
    phone: string;
    password: string;
    agreeTerms: boolean;
    role: 'user';
  }) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authService.registerUser(data);
      setNewUser(userData);
      return userData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error, newUser };
};

// Custom hook untuk register event organizer
export const useRegisterEventOrganizer = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newEventOrganizer, setNewEventOrganizer] = useState<User | null>(null);

  const register = async (data: {
    username: string;
    fullName: string;
    email: string;
    phone: string;
    organizerName: string;
    password: string;
    agreeTerms: boolean;
    role: 'eventOrganizer';
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      // Salin dan pastikan semua properti ada dengan format yang diharapkan
      const formattedData = {
        ...data,
        username: data.username.trim(),
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        organizerName: data.organizerName.trim(),
        password: data.password,
        agreeTerms: data.agreeTerms,
        role: 'eventOrganizer' as const
      };
      
      // Saat admin mendaftarkan EO, hasilnya berupa data event organizer baru, bukan admin yang login
      const userData = await authService.registerEventOrganizer(formattedData);
      
      // Simpan data event organizer baru tanpa mengganti state user saat ini
      setNewEventOrganizer(userData);
      
      return userData;
    } catch (err) {
      console.error('Error in useRegisterEventOrganizer:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error, newEventOrganizer };
};

// Custom hook untuk mendapatkan user saat ini
export const useCurrentUser = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      setError(null);
      if (authService.isAuthenticated()) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
        return userData;
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get user data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchCurrentUser, loading, error, user };
};

// Custom hook untuk logout
export const useLogout = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await authService.logout();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { logout, loading, error };
}; 