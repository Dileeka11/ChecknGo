import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User } from '@/types';
import { loginUser as loginUserApi } from '@/lib/api';

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
    
    try {
      const result = await loginUserApi(email, password);
      
      if (result.success && result.data) {
        const userData: User = {
          id: result.data._id,
          email: result.data.email,
          name: result.data.name,
          role: result.data.role === 'manager' ? 'manager' : 'staff',
          permissions: result.data.permissions,
        };
        
        setUser(userData);
        localStorage.setItem('checkngo_user', JSON.stringify(userData));
        
        // Store JWT token
        if (result.token) {
          localStorage.setItem('checkngo_token', result.token);
        }
        
        setIsLoading(false);
        return { success: true };
      }
      
      setIsLoading(false);
      return { success: false, error: result.message || 'Login failed' };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: 'Failed to connect to server' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('checkngo_user');
    localStorage.removeItem('checkngo_token');
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
