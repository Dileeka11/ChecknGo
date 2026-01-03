import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User } from '@/types';

// Mock users data
export const MOCK_USERS: User[] = [
  { id: 'user-1', email: 'manager@checkngo.com', name: 'Priya Sharma', role: 'manager' },
  { id: 'user-2', email: 'staff1@checkngo.com', name: 'Rahul Kumar', role: 'staff' },
  { id: 'user-3', email: 'staff2@checkngo.com', name: 'Anita Patel', role: 'staff' },
  { id: 'user-4', email: 'staff3@checkngo.com', name: 'Vikram Singh', role: 'staff' },
];

// Mock passwords (in real app, this would be hashed and on backend)
const MOCK_PASSWORDS: Record<string, string> = {
  'manager@checkngo.com': 'manager123',
  'staff1@checkngo.com': 'staff123',
  'staff2@checkngo.com': 'staff123',
  'staff3@checkngo.com': 'staff123',
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('checkngo_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const correctPassword = MOCK_PASSWORDS[email.toLowerCase()];
    
    if (!correctPassword) {
      setIsLoading(false);
      return { success: false, error: 'User not found' };
    }
    
    if (correctPassword !== password) {
      setIsLoading(false);
      return { success: false, error: 'Invalid password' };
    }
    
    const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('checkngo_user', JSON.stringify(foundUser));
      setIsLoading(false);
      return { success: true };
    }
    
    setIsLoading(false);
    return { success: false, error: 'Login failed' };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('checkngo_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
